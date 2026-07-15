/**
 * warehouse.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for companies/{companyId}/warehouses/{warehouseId}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection, doc, setDoc, getDoc,
  updateDoc, deleteDoc, getDocs,
  addDoc,
} from "firebase/firestore";
import db from "./firebase";
import { Warehouse } from "../types";

export interface CreateWarehouseInput {
  companyId:  string;
  createdBy:  string;
  name:       string;
  code:       string;
  address?:   string;
  city?:      string;
  country?:   string;
  isDefault?: boolean;
}

export const WarehouseService = {

  /** Create a warehouse — uses a deterministic ID for the main warehouse */
 async create(input: CreateWarehouseInput): Promise<Warehouse> {
  if (input.isDefault) {
    const existingDefault = await getDoc(doc(db, "companies", input.companyId, "warehouses", "main_warehouse"));
    if (existingDefault.exists()) {
      throw new Error("A default (main) warehouse already exists for this company.");
    }
  }
  const id = input.isDefault ? "main_warehouse" : undefined;
    const data: Omit<Warehouse, "id"> = {
      name:       input.name,
      code:       input.code,
      address:    input.address  ?? "",
      city:       input.city     ?? "",
      country:    input.country  ?? "",
      isDefault:  input.isDefault ?? false,
      companyId:  input.companyId,
      createdBy:  input.createdBy,
      createdAt:  new Date(),
      updatedAt:  new Date(),
    };

    const ref = id
      ? doc(db, "companies", input.companyId, "warehouses", id)
      : doc(collection(db, "companies", input.companyId, "warehouses"));

    await setDoc(ref, data);
    // console.log(`✅ [WarehouseService] warehouses/${ref.id} written`);
    return { id: ref.id, ...data };
  },

  async get(companyId: string, warehouseId: string): Promise<Warehouse> {
    const snap = await getDoc(doc(db, "companies", companyId, "warehouses", warehouseId));
    if (!snap.exists()) throw new Error(`Warehouse not found: ${warehouseId}`);
    return { id: snap.id, ...snap.data() } as Warehouse;
  },

  async list(companyId: string): Promise<Warehouse[]> {
    const snap = await getDocs(collection(db, "companies", companyId, "warehouses"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Warehouse));
  },

  async update(companyId: string, warehouseId: string, updates: Partial<Warehouse>): Promise<void> {
    await updateDoc(
      doc(db, "companies", companyId, "warehouses", warehouseId),
      { ...updates, updatedAt: new Date() }
    );
  },

  async delete(companyId: string, warehouseId: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId, "warehouses", warehouseId));
  },
};
