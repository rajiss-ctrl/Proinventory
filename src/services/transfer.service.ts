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
  deleteDoc,
  DocumentReference,
  increment,
} from "firebase/firestore";
import { Transfer, StockMovement, Product, InventoryRecord } from "../types";
import { InventoryService } from "./inventory.service";

// Type for transfer items
interface TransferItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  id?: string;
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
   * Fetch transfers for a specific company
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
    return docRef.id;
  }

  /**
   * Update status (for cancellations)
   * Releases reserved stock when cancelled
   */
  static async updateStatus(companyId: string, transferId: string, status: Transfer["status"]) {
    const transferRef = doc(db, "companies", companyId, "transfers", transferId);
    
    await runTransaction(db, async (transaction) => {
      const transferSnap = await transaction.get(transferRef);
      if (!transferSnap.exists()) {
        throw new Error("Transfer not found.");
      }
      
      const transfer = transferSnap.data() as TransferData;
      
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

    await runTransaction(db, async (transaction) => {
      // ============================================================
      // STEP 1: READ ALL DATA FIRST
      // ============================================================
      
      // Read transfer document
      const transferSnap = await transaction.get(transferRef);
      if (!transferSnap.exists()) {
        throw new Error("Transfer request not found.");
      }

      const transfer = transferSnap.data() as TransferData;

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
        // This MUST happen - it's the most important part
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
        // This creates the inventory record if it doesn't exist
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

        // If this is a new inventory record, add createdAt
        if (!toData) {
          toDataToSave.createdAt = serverTimestamp();
        }

        transaction.set(toRef, toDataToSave, { merge: true });

        // 3. UPDATE PRODUCT'S TOTAL STOCK QUANTITY
        // Sum across all warehouses for accurate total
        // For simplicity, we update with a calculated total
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