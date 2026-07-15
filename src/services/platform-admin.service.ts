/**
 * platform-admin.service.ts
 * Super-admin operations: read all users, all companies, activate/deactivate, delete.
 */
import {
  collection, getDocs, doc,
  updateDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import db from "./firebase";
import { UserProfile, Company } from "../types";

export const PlatformAdminService = {

  async listAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile));
  },

  async listAllCompanies(): Promise<Company[]> {
    const snap = await getDocs(collection(db, "companies"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
  },

  async toggleUserStatus(uid: string, currentStatus: string): Promise<void> {
    const next = currentStatus === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "users", uid), { status: next, updatedAt: new Date() });
    console.log(`✅ [PlatformAdminService] User ${uid} status → ${next}`);
  },

  async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid));
    console.log(`✅ [PlatformAdminService] User ${uid} deleted`);
  },

  async toggleCompanyStatus(companyId: string, currentStatus: string): Promise<void> {
    const next = currentStatus === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "companies", companyId), { status: next, updatedAt: new Date() });
  },

  async deleteCompany(companyId: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId));
  },

  async getStats(): Promise<{ totalUsers: number; totalCompanies: number; activePlans: Record<string, number> }> {
    const [users, companies] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "companies")),
    ]);
    const activePlans: Record<string, number> = {};
    companies.docs.forEach((d) => {
      const plan = d.data().plan ?? "starter";
      activePlans[plan] = (activePlans[plan] ?? 0) + 1;
    });
    return { totalUsers: users.size, totalCompanies: companies.size, activePlans };
  },
};
