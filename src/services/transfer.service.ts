import db from "./firebase";
import { 
  doc, 
  runTransaction, 
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  DocumentReference,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  Query,
} from "firebase/firestore";
import { Transfer, TransferItem } from "../types";
import { InventoryService } from "./inventory.service";



// Type for pagination response
export interface PaginatedTransfers {
  transfers: Transfer[];
  totalCount: number;
  lastVisible: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

// Type for transfer data from Firestore
interface TransferData extends Transfer {
  items: TransferItem[];
}

// Type for inventory data from Firestore
interface InventoryData {
  quantity: number;
  reservedQty?: number;
  productName?: string;
  warehouseName?: string;
  reorderLevel?: number;
  availableQty?: number;
  updatedAt?: any;
  companyId?: string;
  productId?: string;
  warehouseId?: string;
}

// Type for product data from Firestore
interface ProductData {
  sku?: string;
  stockQuantity?: number;
  name?: string;
}

export class TransferService {
  /**
   * Fetch transfers for a specific company (legacy - kept for compatibility)
   */
  static async list(companyId: string): Promise<Transfer[]> {
    const ref = collection(db, "companies", companyId, "transfers");
    const snap = await getDocs(ref);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Transfer[];
  }

  /**
   * Fetch transfers with pagination
   */
  static async listPaginated(
    companyId: string,
    pageSize: number = 10,
    lastVisible?: QueryDocumentSnapshot,
    statusFilter?: string
  ): Promise<PaginatedTransfers> {
    const ref = collection(db, "companies", companyId, "transfers");
    
    // Build base query
    let q: Query = query(
      ref,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Add status filter if provided
    if (statusFilter && statusFilter !== "all") {
      q = query(q, where("status", "==", statusFilter));
    }

    // Add startAfter for pagination
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    // Get total count (cached or separate query)
    let countQuery: Query = ref;
    if (statusFilter && statusFilter !== "all") {
      countQuery = query(ref, where("status", "==", statusFilter));
    }
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    // Get paginated results
    const snap = await getDocs(q);
    const transfers = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Transfer[];

    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      transfers,
      totalCount,
      lastVisible: lastDoc,
      hasMore: snap.docs.length === pageSize,
    };
  }

  /**
   * Get transfers by status (for filtering)
   */
  static async listByStatus(
    companyId: string,
    status: Transfer["status"],
    pageSize: number = 10,
    lastVisible?: QueryDocumentSnapshot
  ): Promise<PaginatedTransfers> {
    return this.listPaginated(companyId, pageSize, lastVisible, status);
  }

  /**
   * Create a new transfer request in 'pending' status
   * Also reserves stock in the source warehouse
   */
  static async create(data: {
    companyId: string;
    createdBy: string;
    fromWarehouseId: string;
    fromWarehouseName: string;
    toWarehouseId: string;
    toWarehouseName: string;
    items: Array<{ productId: string; productName: string; sku?: string; quantity: number }>;
    notes?: string;
  }) {
    const ref = collection(db, "companies", data.companyId, "transfers");
    const transferNumber = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTransfer = {
      ...data,
      transferNumber,
      status: "pending" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(ref);
    
    // Reserve stock before creating the transfer
    for (const item of data.items) {
      await InventoryService.reserve(
        data.companyId,
        item.productId,
        data.fromWarehouseId,
        item.quantity
      );
    }

    await setDoc(docRef, newTransfer);

    // ✅ CREATE NOTIFICATION FOR THE TRANSFER
    await this.createTransferNotification(data.companyId, {
      transferId: docRef.id,
      transferNumber,
      fromWarehouseName: data.fromWarehouseName,
      toWarehouseName: data.toWarehouseName,
      items: data.items,
      notes: data.notes,
      createdBy: data.createdBy,
    });

    return docRef.id;
  }

 static async createTransferNotification(
  companyId: string,
  data: {
    transferId: string;
    transferNumber: string;
    fromWarehouseName: string;
    toWarehouseName: string;
    items: Array<{ productId: string; productName: string; sku?: string; quantity: number }>;
    notes?: string;
    createdBy: string;
  }
) {
  try {
    // ✅ Ensure we have a valid transfer ID
    if (!data.transferId) {
      console.error("[TransferService] Cannot create transfer notification: transferId is undefined", data);
      return;
    }

    const notificationRef = collection(db, "companies", companyId, "notifications");
    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemNames = data.items.map(item => `${item.productName} (${item.quantity})`).join(", ");
    
    // Build detailed message with notes
    let message = `${data.fromWarehouseName} → ${data.toWarehouseName}: ${totalItems} units`;
    
    // Add item details
    if (data.items.length > 0) {
      message += `\nItems: ${itemNames}`;
    }
    
    // Add notes if present
    if (data.notes && data.notes.trim()) {
      message += `\n📝 Notes: ${data.notes.trim()}`;
    }
    
    const notification = {
      type: "transfer_request",
      title: `📦 New Transfer: ${data.transferNumber}`,
      message: message,
      transferId: data.transferId,
      transferNumber: data.transferNumber,
      fromWarehouse: data.fromWarehouseName,
      toWarehouse: data.toWarehouseName,
      items: data.items,
      totalItems,
      notes: data.notes || "",
      status: "unread",
      createdAt: serverTimestamp(),
      createdBy: data.createdBy,
      readAt: null,
    };

    // ✅ Log the notification before saving
    console.log(`[TransferService] Creating transfer notification:`, notification);

    const docRef = doc(notificationRef);
    await setDoc(docRef, notification);
    console.log(`✅ [TransferService] Notification created for transfer ${data.transferNumber}`);
  } catch (error) {
    console.error("[TransferService] Failed to create notification:", error);
  }
}

 /**
 * Create notification for transfer status update (completed or cancelled)
 */
static async createStatusUpdateNotification(
  companyId: string,
  transfer: TransferData,
  status: Transfer["status"]
) {
  try {
    // ✅ Ensure we have a valid transfer ID
    if (!transfer.id) {
      console.error("[TransferService] Cannot create status notification: transfer.id is undefined", transfer);
      return;
    }

    const notificationRef = collection(db, "companies", companyId, "notifications");
    const totalItems = (transfer.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
    const itemNames = (transfer.items ?? []).map(item => `${item.productName} (${item.quantity})`).join(", ");
    
    let title: string;
    let message: string;
    let type: string;

    if (status === "completed") {
      title = `✅ Transfer Completed: ${transfer.transferNumber}`;
      message = `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}\nItems: ${itemNames}\nTotal: ${totalItems} units successfully transferred`;
      type = "transfer_completed";
    } else if (status === "cancelled") {
      title = `❌ Transfer Cancelled: ${transfer.transferNumber}`;
      message = `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}\nItems: ${itemNames}\nTotal: ${totalItems} units cancelled`;
      type = "transfer_cancelled";
    } else {
      return;
    }

    // Add notes if present
    if (transfer.notes && transfer.notes.trim()) {
      message += `\n📝 Notes: ${transfer.notes.trim()}`;
    }

    const notification = {
      type,
      title,
      message,
      transferId: transfer.id, // ✅ Now this should be defined
      transferNumber: transfer.transferNumber || `TRF-${Date.now()}`,
      fromWarehouse: transfer.fromWarehouseName || transfer.fromWarehouseId,
      toWarehouse: transfer.toWarehouseName || transfer.toWarehouseId,
      items: transfer.items || [],
      totalItems,
      notes: transfer.notes || "",
      status: "unread",
      createdAt: serverTimestamp(),
      createdBy: transfer.createdBy || "system",
      readAt: null,
    };

    // ✅ Log the notification before saving
    console.log(`[TransferService] Creating status notification:`, notification);

    const docRef = doc(notificationRef);
    await setDoc(docRef, notification);
    console.log(`✅ [TransferService] Notification created for transfer ${transfer.transferNumber} status: ${status}`);
  } catch (error) {
    console.error("[TransferService] Failed to create status notification:", error);
    // Don't throw - we don't want to fail the transfer if notification fails
  }
}

  /**
   * Update status (for cancellations)
   * Releases reserved stock when cancelled
   */
  static async updateStatus(companyId: string, transferId: string, status: Transfer["status"]) {
  const transferRef = doc(db, "companies", companyId, "transfers", transferId);
  
  let transferData: TransferData | null = null;

  await runTransaction(db, async (transaction) => {
    const transferSnap = await transaction.get(transferRef);
    if (!transferSnap.exists()) {
      throw new Error("Transfer not found.");
    }
    
    const transfer = transferSnap.data() as TransferData;
    
    // ✅ Ensure the ID is set on the transfer data
    transferData = {
      ...transfer,
      id: transferId, // ✅ Explicitly set the ID
    };
    
    // If cancelling, release reserved stock
    if (status === "cancelled" && (transfer.status === "pending" || transfer.status === "in_transit")) {
      for (const item of (transfer.items ?? [])) {
        await InventoryService.release(
          companyId,
          item.productId,
          transfer.fromWarehouseId,
          item.quantity
        );
      }
    }
    
    transaction.update(transferRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  });

  // Create notification for status change (completed or cancelled)
  if (transferData && (status === "completed" || status === "cancelled")) {
    console.log(`[TransferService] Creating status notification for transfer:`, transferData);
    await this.createStatusUpdateNotification(companyId, transferData, status);
  }
}

  /**
   * Confirms receipt of a transfer request.
   * - Deducts quantity from source warehouse inventory
   * - Adds quantity to destination warehouse (creates if missing)
   * - Releases the reserved stock
   * - Logs stock movements
   */
  static async confirmReceipt(
  companyId: string,
  transferId: string,
  receivedByUid: string,
  userWarehouseScope?: string
) {
  const transferRef = doc(db, "companies", companyId, "transfers", transferId);
  let transferData: TransferData | null = null;

  await runTransaction(db, async (transaction) => {
    // Read transfer document
    const transferSnap = await transaction.get(transferRef);
    if (!transferSnap.exists()) {
      throw new Error("Transfer request not found.");
    }

    const transfer = transferSnap.data() as TransferData;
    
    // ✅ Ensure the ID is set on the transfer data
    transferData = {
      ...transfer,
      id: transferId, // ✅ Explicitly set the ID
    };

      if (transfer.status === "completed") {
        throw new Error("This transfer has already been completed.");
      }

      // Restrict branch staff to confirming receipts intended for their scope
      if (userWarehouseScope && transfer.toWarehouseId !== userWarehouseScope) {
        throw new Error("You can only confirm receipts for your assigned warehouse.");
      }

      // Prepare to read all inventory and product data
      const itemsToProcess: {
        item: TransferItem;
        fromRef: DocumentReference;
        toRef: DocumentReference;
        productRef: DocumentReference;
      }[] = [];

      for (const item of (transfer.items ?? [])) {
        // Use the correct inventory path: companies/{companyId}/inventory/{productId}_{warehouseId}
        const fromInventoryId = `${item.productId}_${transfer.fromWarehouseId}`;
        const toInventoryId = `${item.productId}_${transfer.toWarehouseId}`;
        
        const fromRef = doc(db, "companies", companyId, "inventory", fromInventoryId);
        const toRef = doc(db, "companies", companyId, "inventory", toInventoryId);
        const productRef = doc(db, "companies", companyId, "products", item.productId);

        itemsToProcess.push({ item, fromRef, toRef, productRef });
      }

      // READ all data in the transaction
      const readResults = await Promise.all(
        itemsToProcess.map(async ({ item, fromRef, toRef, productRef }) => {
          const [fromSnap, toSnap, productSnap] = await Promise.all([
            transaction.get(fromRef),
            transaction.get(toRef),
            transaction.get(productRef)
          ]);

          // Product must exist in the catalog
          if (!productSnap.exists()) {
            throw new Error(`Product "${item.productName}" not found in the product catalog. Please add it first.`);
          }

          // Source must have the product in inventory
          if (!fromSnap.exists()) {
            throw new Error(
              `Product "${item.productName}" not found in source warehouse "${transfer.fromWarehouseName}". ` +
              `Please ensure the product exists in the source warehouse inventory.`
            );
          }

          const fromData = fromSnap.data() as InventoryData;
          const toData = toSnap.exists() ? (toSnap.data() as InventoryData) : null;
          const productData = productSnap.data() as ProductData;

          console.log(`[Transfer] Product: ${item.productName}`);
          console.log(`[Transfer] From Qty: ${fromData.quantity || 0}, Reserved: ${fromData.reservedQty || 0}`);
          console.log(`[Transfer] To Qty: ${toData?.quantity || 0}`);
          console.log(`[Transfer] Transfer Qty: ${item.quantity}`);

          return {
            item,
            fromRef,
            toRef,
            productRef,
            fromData,
            toData,
            productData,
          };
        })
      );

      // ============================================================
      // STEP 2: VALIDATE ALL DATA
      // ============================================================
      
      for (const result of readResults) {
        const { fromData, item } = result;
        const reserved = fromData.reservedQty || 0;
        const availableQty = (fromData.quantity || 0) - reserved;
        
        if (availableQty < item.quantity) {
          throw new Error(
            `Insufficient available quantity for "${item.productName}" in ${transfer.fromWarehouseName}. ` +
            `Available: ${availableQty}, Requested: ${item.quantity}`
          );
        }
      }

      // ============================================================
      // STEP 3: PERFORM ALL WRITES
      // ============================================================
      
      for (const result of readResults) {
        const { item, fromRef, toRef, productRef, fromData, toData, productData } = result;
        
        const currentFromQty = fromData.quantity || 0;
        const currentToQty = toData?.quantity || 0;
        const reserved = fromData.reservedQty || 0;
        
        // Calculate new quantities
        const newFromQty = currentFromQty - item.quantity;
        const newToQty = currentToQty + item.quantity;
        const newReserved = Math.max(0, reserved - item.quantity);

        console.log(`[Transfer] Updating ${item.productName}:`);
        console.log(`[Transfer]   From: ${currentFromQty} -> ${newFromQty}`);
        console.log(`[Transfer]   To: ${currentToQty} -> ${newToQty}`);
        console.log(`[Transfer]   Reserved: ${reserved} -> ${newReserved}`);

        // 1. UPDATE SOURCE WAREHOUSE INVENTORY (DEDUCT)
        transaction.set(fromRef, {
          productId: item.productId,
          productName: item.productName,
          warehouseId: transfer.fromWarehouseId,
          warehouseName: transfer.fromWarehouseName,
          quantity: newFromQty,
          reservedQty: newReserved,
          availableQty: newFromQty - newReserved,
          reorderLevel: fromData.reorderLevel || 10,
          companyId,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // 2. UPDATE DESTINATION WAREHOUSE INVENTORY (CREATE OR ADD)
        const toDataToSave: any = {
          productId: item.productId,
          productName: item.productName,
          warehouseId: transfer.toWarehouseId,
          warehouseName: transfer.toWarehouseName,
          quantity: newToQty,
          reservedQty: toData?.reservedQty || 0,
          availableQty: newToQty - (toData?.reservedQty || 0),
          reorderLevel: toData?.reorderLevel || 10,
          companyId,
          updatedAt: serverTimestamp(),
        };

        if (!toData) {
          toDataToSave.createdAt = serverTimestamp();
        }

        transaction.set(toRef, toDataToSave, { merge: true });

        // 3. UPDATE PRODUCT'S TOTAL STOCK QUANTITY
        const totalQty = newFromQty + newToQty;
        transaction.update(productRef, {
          stockQuantity: totalQty,
          status: totalQty === 0 ? "out_of_stock" : 
                  totalQty <= 10 ? "low_stock" : "in_stock",
          updatedAt: serverTimestamp(),
        });

        // 4. LOG STOCK MOVEMENT - SOURCE (TRANSFER OUT)
        const movementFromRef = doc(collection(db, "companies", companyId, "stockMovements"));
        transaction.set(movementFromRef, {
          companyId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku || productData?.sku || "",
          warehouseId: transfer.fromWarehouseId,
          type: "transfer_out",
          quantity: -item.quantity,
          balanceBefore: currentFromQty,
          balanceAfter: newFromQty,
          reference: transfer.transferNumber || transferId,
          notes: `Transferred ${item.quantity} units to ${transfer.toWarehouseName}`,
          createdBy: receivedByUid,
          createdAt: serverTimestamp(),
        });

        // 5. LOG STOCK MOVEMENT - DESTINATION (TRANSFER IN)
        const movementToRef = doc(collection(db, "companies", companyId, "stockMovements"));
        transaction.set(movementToRef, {
          companyId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku || productData?.sku || "",
          warehouseId: transfer.toWarehouseId,
          type: "transfer_in",
          quantity: item.quantity,
          balanceBefore: currentToQty,
          balanceAfter: newToQty,
          reference: transfer.transferNumber || transferId,
          notes: `Received ${item.quantity} units from ${transfer.fromWarehouseName}`,
          createdBy: receivedByUid,
          createdAt: serverTimestamp(),
        });
      }

      // 6. MARK TRANSFER AS COMPLETED
      transaction.update(transferRef, {
        status: "completed",
        receivedBy: receivedByUid,
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log(`[Transfer] Transfer ${transferId} completed successfully!`);
    });

    // Create notification for completed transfer
    if (transferData) {
      await this.createStatusUpdateNotification(companyId, transferData, "completed");
    }
  }

  /**
   * Calculate total quantity of a product across all warehouses
   */
  static async calculateTotalProductQuantity(
    companyId: string, 
    productId: string
  ): Promise<number> {
    const inventoryRef = collection(db, "companies", companyId, "inventory");
    const q = query(inventoryRef, where("productId", "==", productId));
    const snap = await getDocs(q);
    
    let total = 0;
    snap.forEach((doc) => {
      total += doc.data().quantity || 0;
    });
    
    return total;
  }
}