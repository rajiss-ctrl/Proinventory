/**
 * category.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for companies/{companyId}/categories/{categoryId}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection, doc, setDoc, getDoc,
  updateDoc, deleteDoc, getDocs, addDoc,
} from "firebase/firestore";
import db from "./firebase";
import { Category } from "../types";

export interface CreateCategoryInput {
  companyId:    string;
  createdBy:    string;
  name:         string;
  description?: string;
}

export const CategoryService = {

  async create(input: CreateCategoryInput): Promise<Category> {
    const ref  = doc(collection(db, "companies", input.companyId, "categories"));
    const data: Omit<Category, "id"> = {
      name:        input.name,
      description: input.description ?? "",
      companyId:   input.companyId,
      createdBy:   input.createdBy,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
    await setDoc(ref, data);
    return { id: ref.id, ...data };
  },

  async get(companyId: string, categoryId: string): Promise<Category> {
    const snap = await getDoc(doc(db, "companies", companyId, "categories", categoryId));
    if (!snap.exists()) throw new Error(`Category not found: ${categoryId}`);
    return { id: snap.id, ...snap.data() } as Category;
  },

  async list(companyId: string): Promise<Category[]> {
    const snap = await getDocs(collection(db, "companies", companyId, "categories"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  },

  async update(companyId: string, categoryId: string, updates: Partial<Category>): Promise<void> {
    await updateDoc(
      doc(db, "companies", companyId, "categories", categoryId),
      { ...updates, updatedAt: new Date() }
    );
  },

  async delete(companyId: string, categoryId: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId, "categories", categoryId));
  },
};
