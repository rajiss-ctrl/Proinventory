import {
  collection, doc, setDoc, runTransaction,
  serverTimestamp, getDocs, query, where,
  orderBy, limit, getCountFromServer,
  QueryDocumentSnapshot, startAfter,
} from "firebase/firestore";
import db from "./firebase";
import { Product } from "../types";
import { InventoryService } from "./inventory.service";
import { StockMovementService } from "./stock-movement.service";

export interface SaleRecord {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'bank_deposit';
  discount: number;
  tax: number;
  createdAt: Date;
  createdBy: string;
}

export interface RecordSaleInput {
  companyId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'bank_deposit';
  discount: number;
  tax: number;
  createdBy: string;
}

export interface PaginatedSales {
  sales: SaleRecord[];
  totalCount: number;
  lastVisible: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const SalesService = {
  /**
   * Record a sale - updates inventory and creates sale record
   */
  async recordSale(input: RecordSaleInput): Promise<string> {
    const { companyId, productId, quantity, createdBy } = input;

    // Get the product document
    const productRef = doc(db, "companies", companyId, "products", productId);

    // Get inventory record
    const inventoryId = `${productId}_main_warehouse`; // You may need to determine which warehouse
    const inventoryRef = doc(db, "companies", companyId, "inventory", inventoryId);

    let saleId = "";

    await runTransaction(db, async (transaction) => {
      // Read current data
      const productSnap = await transaction.get(productRef);
      const inventorySnap = await transaction.get(inventoryRef);

      if (!productSnap.exists()) {
        throw new Error(`Product ${input.productName} not found`);
      }

      if (!inventorySnap.exists()) {
        throw new Error(`Inventory record for ${input.productName} not found`);
      }

      const productData = productSnap.data();
      const inventoryData = inventorySnap.data();

      // Check stock availability
      const currentStock = inventoryData.quantity || 0;
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }

      const newStock = currentStock - quantity;
      const newReserved = inventoryData.reservedQty || 0;

      // 1. Update inventory
      transaction.update(inventoryRef, {
        quantity: newStock,
        availableQty: newStock - newReserved,
        updatedAt: serverTimestamp(),
      });

      // 2. Update product stock
      transaction.update(productRef, {
        stockQuantity: newStock,
        status: newStock === 0 ? "out_of_stock" : newStock <= 10 ? "low_stock" : "in_stock",
        updatedAt: serverTimestamp(),
      });

      // 3. Create sale record
      const saleRef = doc(collection(db, "companies", companyId, "sales"));
      const saleData: Omit<SaleRecord, "id" | "createdAt"> = {
        companyId,
        productId,
        productName: input.productName,
        sku: input.sku,
        quantity,
        price: input.price,
        totalAmount: input.totalAmount,
        customerName: input.customerName || "",
        customerEmail: input.customerEmail || "",
        notes: input.notes || "",
        paymentMethod: input.paymentMethod,
        discount: input.discount || 0,
        tax: input.tax || 0,
        createdBy,
      };

      transaction.set(saleRef, {
        ...saleData,
        createdAt: serverTimestamp(),
      });

      saleId = saleRef.id;

      // 4. Log stock movement
      const movementRef = doc(collection(db, "companies", companyId, "stockMovements"));
      transaction.set(movementRef, {
        companyId,
        productId,
        productName: input.productName,
        sku: input.sku,
        warehouseId: "main_warehouse",
        type: "sale",
        quantity: -quantity,
        balanceBefore: currentStock,
        balanceAfter: newStock,
        reference: `SALE-${saleRef.id.slice(0, 8).toUpperCase()}`,
        notes: `Sale of ${quantity} units to ${input.customerName || "Walk-in Customer"}`,
        createdBy,
        createdAt: serverTimestamp(),
      });
    });

    return saleId;
  },

  /**
   * Get sales for a company with pagination
   */
  async list(
    companyId: string,
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot
  ): Promise<PaginatedSales> {
    const ref = collection(db, "companies", companyId, "sales");
    
    let q = query(
      ref,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const countSnapshot = await getCountFromServer(ref);
    const totalCount = countSnapshot.data().count;

    const snap = await getDocs(q);
    const sales = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as SaleRecord[];

    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      sales,
      totalCount,
      lastVisible: lastDoc,
      hasMore: snap.docs.length === pageSize,
    };
  },

  /**
   * Get total sales amount for a period
   */
  async getTotalSales(companyId: string, days: number = 30): Promise<number> {
    const ref = collection(db, "companies", companyId, "sales");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    
    const q = query(
      ref,
      where("createdAt", ">=", thirtyDaysAgo),
      orderBy("createdAt", "desc")
    );
    
    const snap = await getDocs(q);
    let total = 0;
    snap.forEach((doc) => {
      total += doc.data().totalAmount || 0;
    });
    
    return total;
  },
};