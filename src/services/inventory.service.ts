/**
 * inventory.service.ts
 * CRUD for companies/{companyId}/inventory/{inventoryId}
 */
import {
  collection, doc, setDoc, getDoc,
  getDocs, query, where, runTransaction,
  DocumentReference, Firestore, Transaction,
} from "firebase/firestore";
import db from "./firebase";
import { InventoryRecord } from "../types";

export interface UpsertInventoryInput {
  companyId:     string;
  productId:     string;
  productName:   string;
  warehouseId:   string;
  warehouseName: string;
  quantity:      number;
  reorderLevel?: number;
}

// Type for inventory data from Firestore
export interface InventoryData {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  reorderLevel: number;
  companyId: string;
  createdAt?: Date;
  updatedAt: Date;
}

export const InventoryService = {

  /** Upsert inventory record — ID is deterministic: {productId}_{warehouseId} */
  async upsert(input: UpsertInventoryInput): Promise<InventoryRecord> {
    const id = `${input.productId}_${input.warehouseId}`;
    const available = Math.max(0, input.quantity);
    const data: Omit<InventoryRecord, "id"> = {
      productId:     input.productId,
      productName:   input.productName,
      warehouseId:   input.warehouseId,
      warehouseName: input.warehouseName,
      quantity:      input.quantity,
      reservedQty:   0,
      availableQty:  available,
      reorderLevel:  input.reorderLevel ?? 10,
      companyId:     input.companyId,
      updatedAt:     new Date(),
    };
    await setDoc(
      doc(db, "companies", input.companyId, "inventory", id),
      data,
      { merge: true }
    );
    return { id, ...data };
  },

  async get(companyId: string, productId: string, warehouseId: string): Promise<InventoryRecord | null> {
    const id   = `${productId}_${warehouseId}`;
    const snap = await getDoc(doc(db, "companies", companyId, "inventory", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as InventoryRecord;
  },

  async listByProduct(companyId: string, productId: string): Promise<InventoryRecord[]> {
    const snap = await getDocs(
      query(collection(db, "companies", companyId, "inventory"),
            where("productId", "==", productId))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryRecord));
  },

  async listByWarehouse(companyId: string, warehouseId: string): Promise<InventoryRecord[]> {
    const snap = await getDocs(
      query(collection(db, "companies", companyId, "inventory"),
            where("warehouseId", "==", warehouseId))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryRecord));
  },

  /**
   * Get total quantity of this product across every warehouse.
   * This is the single source of truth for "how much of this product do we
   * actually own?" — the product document's cached stockQuantity should
   * always be refreshed FROM this number, never incremented independently.
   */
  async getTotalForProduct(companyId: string, productId: string): Promise<number> {
    const records = await this.listByProduct(companyId, productId);
    return records.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
  },

  /**
   * Get inventory record with transaction support
   */
  async getWithTransaction(
    transaction: Transaction,
    companyId: string,
    productId: string,
    warehouseId: string
  ): Promise<{ ref: DocumentReference; data: InventoryData | null; exists: boolean }> {
    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    const snap = await transaction.get(ref);
    
    if (!snap.exists()) {
      return { ref, data: null, exists: false };
    }
    
    const data = snap.data() as InventoryData;
    return { ref, data, exists: true };
  },

  /**
   * Create or update inventory with transaction support
   */
  async upsertWithTransaction(
    transaction: Transaction,
    companyId: string,
    productId: string,
    productName: string,
    warehouseId: string,
    warehouseName: string,
    quantity: number,
    reservedQty: number = 0,
    reorderLevel: number = 10
  ): Promise<void> {
    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    const available = Math.max(0, quantity - reservedQty);
    
    const data: Partial<InventoryData> = {
      productId,
      productName,
      warehouseId,
      warehouseName,
      quantity,
      reservedQty,
      availableQty: available,
      reorderLevel,
      companyId,
      updatedAt: new Date(),
    };

    transaction.set(ref, data, { merge: true });
  },

  /**
   * Kept for manual/one-off adjustments (e.g. a stock count correction) that
   * are NOT part of a transfer. Transfers use the transaction-safe logic
   * inside TransferService.confirmReceipt instead, so two changes can never
   * partially apply.
   */
  async adjustQuantity(companyId: string, productId: string, warehouseId: string, delta: number): Promise<void> {
    const id   = `${productId}_${warehouseId}`;
    const snap = await getDoc(doc(db, "companies", companyId, "inventory", id));
    const existing = snap.exists() ? (snap.data() as InventoryRecord) : null;
    const current = existing?.quantity ?? 0;
    const reserved = existing?.reservedQty ?? 0;
    const newQty = Math.max(0, current + delta);
    const productSnap = await getDoc(doc(db, "companies", companyId, "products", productId));
    const productName = productSnap.exists() ? String(productSnap.data().name ?? "") : existing?.productName ?? "";

    await setDoc(
      doc(db, "companies", companyId, "inventory", id),
      {
        productId,
        productName,
        warehouseId,
        warehouseName: existing?.warehouseName ?? warehouseId,
        quantity: newQty,
        reservedQty: reserved,
        availableQty: Math.max(0, newQty - reserved),
        reorderLevel: existing?.reorderLevel ?? 10,
        companyId,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  },

  /**
   * Hold stock the moment a transfer is requested, so the same units
   * can't be double-booked into a second transfer or a sale while this one
   * is still "in_transit". Uses a transaction so two simultaneous requests
   * for the last few units can't both succeed.
   */
  async reserve(companyId: string, productId: string, warehouseId: string, qty: number): Promise<void> {
    if (qty <= 0) {
      throw new Error("Reservation quantity must be greater than 0.");
    }

    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      
      if (!snap.exists()) {
        // Try to get product name from product catalog
        const productSnap = await transaction.get(doc(db, "companies", companyId, "products", productId));
        const productName = productSnap.exists() ? (productSnap.data() as any).name || "Unknown Product" : "Unknown Product";
        
        throw new Error(
          `No stock record for product "${productName}" in the source warehouse. ` +
          `Please ensure the product exists in the warehouse inventory before transferring.`
        );
      }
      
      const data = snap.data() as InventoryData;
      const currentQty = data.quantity || 0;
      const currentReserved = data.reservedQty || 0;
      const available = currentQty - currentReserved;
      
      if (available < qty) {
        throw new Error(
          `Insufficient available stock for "${data.productName}". ` +
          `Available: ${available}, Requested: ${qty}`
        );
      }
      
      const newReserved = currentReserved + qty;
      
      transaction.update(ref, {
        reservedQty: newReserved,
        availableQty: currentQty - newReserved,
        updatedAt: new Date(),
      });
    });
  },

  /**
   * Give reserved stock back. Called when a pending/in_transit transfer
   * is cancelled, so the units become available again.
   */
  async release(companyId: string, productId: string, warehouseId: string, qty: number): Promise<void> {
    if (qty <= 0) {
      throw new Error("Release quantity must be greater than 0.");
    }

    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      
      if (!snap.exists()) {
        console.warn(`[InventoryService] Attempted to release stock for non-existent inventory: ${id}`);
        return;
      }
      
      const data = snap.data() as InventoryData;
      const currentReserved = data.reservedQty || 0;
      const currentQty = data.quantity || 0;
      
      const newReserved = Math.max(0, currentReserved - qty);
      
      if (newReserved !== currentReserved - qty) {
        console.warn(
          `[InventoryService] Release quantity ${qty} exceeds reserved ${currentReserved} for ${data.productName}. ` +
          `Releasing only what's available.`
        );
      }
      
      transaction.update(ref, {
        reservedQty: newReserved,
        availableQty: currentQty - newReserved,
        updatedAt: new Date(),
      });
    });
  },

  /**
   * Update inventory within an existing transaction (for use inside TransferService)
   * This is the transaction-safe version that doesn't start its own transaction
   */
  async updateInTransaction(
    transaction: Transaction,
    companyId: string,
    productId: string,
    warehouseId: string,
    updates: {
      quantity?: number;
      reservedQty?: number;
      availableQty?: number;
      productName?: string;
      warehouseName?: string;
      reorderLevel?: number;
    }
  ): Promise<void> {
    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // If quantity is being updated, recalculate availableQty
    if (updates.quantity !== undefined) {
      const snap = await transaction.get(ref);
      const currentReserved = snap.exists() ? (snap.data() as InventoryData).reservedQty || 0 : 0;
      const newReserved = updates.reservedQty !== undefined ? updates.reservedQty : currentReserved;
      updateData.availableQty = Math.max(0, updates.quantity - newReserved);
    }
    
    transaction.set(ref, updateData, { merge: true });
  },

  /**
   * Get or create inventory record in a transaction
   */
  async getOrCreateInTransaction(
    transaction: Transaction,
    companyId: string,
    productId: string,
    productName: string,
    warehouseId: string,
    warehouseName: string,
    initialQuantity: number = 0
  ): Promise<{ ref: DocumentReference; data: InventoryData; created: boolean }> {
    const id = `${productId}_${warehouseId}`;
    const ref = doc(db, "companies", companyId, "inventory", id);
    const snap = await transaction.get(ref);
    
    if (snap.exists()) {
      return {
        ref,
        data: snap.data() as InventoryData,
        created: false,
      };
    }
    
    // Create new inventory record
    const newData: InventoryData = {
      productId,
      productName,
      warehouseId,
      warehouseName,
      quantity: initialQuantity,
      reservedQty: 0,
      availableQty: initialQuantity,
      reorderLevel: 10,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    transaction.set(ref, newData);
    
    return {
      ref,
      data: newData,
      created: true,
    };
  },
};