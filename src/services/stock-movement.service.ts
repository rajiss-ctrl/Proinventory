/**
 * stock-movement.service.ts
 * Append-only log: companies/{companyId}/stockMovements/{movementId}
 * Never update or delete — immutable audit trail.
 */
import {
  collection, doc, setDoc, getDocs,
  query, where, orderBy, limit,
} from "firebase/firestore";
import db from "./firebase";
import { StockMovement, StockMovementType } from "../types";

export interface LogMovementInput {
  companyId:     string;
  createdBy:     string;
  productId:     string;
  productName:   string;
  sku:           string;
  warehouseId:   string;
  type:          StockMovementType;
  quantity:      number;
  balanceBefore: number;
  balanceAfter:  number;
  reference?:    string;
  notes?:        string;
}

export const StockMovementService = {

  /** Append a new movement record — ID is auto-generated */
  async log(input: LogMovementInput): Promise<StockMovement> {
    const ref  = doc(collection(db, "companies", input.companyId, "stockMovements"));
    const data: Omit<StockMovement, "id"> = {
      productId:     input.productId,
      productName:   input.productName,
      sku:           input.sku,
      warehouseId:   input.warehouseId,
      type:          input.type,
      quantity:      input.quantity,
      balanceBefore: input.balanceBefore,
      balanceAfter:  input.balanceAfter,
      reference:     input.reference ?? "",
      notes:         input.notes     ?? "",
      companyId:     input.companyId,
      createdBy:     input.createdBy,
      createdAt:     new Date(),
    };
    await setDoc(ref, data);
    return { id: ref.id, ...data };
  },

  async listByProduct(companyId: string, productId: string, maxResults = 50): Promise<StockMovement[]> {
    const snap = await getDocs(
      query(
        collection(db, "companies", companyId, "stockMovements"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(maxResults),
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
  },

  async listRecent(companyId: string, maxResults = 20): Promise<StockMovement[]> {
    const snap = await getDocs(
      query(
        collection(db, "companies", companyId, "stockMovements"),
        orderBy("createdAt", "desc"),
        limit(maxResults),
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
  },
};
