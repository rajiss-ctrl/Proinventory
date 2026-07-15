/**
 * company.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for the companies/{companyId} root document.
 * Also contains the full Phase 1 onboarding flow (5 writes in one call).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  doc, setDoc, getDoc, updateDoc,
  deleteDoc, collection, getDocs,
  query, where,
} from "firebase/firestore";
import db from "./firebase";
import { Company, SubscriptionPlan, UserProfile, DEFAULT_PERMISSIONS } from "../types";
import { WarehouseService } from "./warehouse.service";
import { CompanyUserService } from "./company-user.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  ownerId:     string;
  ownerEmail:  string;
  ownerName:   string;
  companyName: string;
  phone?:      string;
  industry?:   string;
  plan?:       SubscriptionPlan;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a deterministic companyId from company name + uid prefix */
export const generateCompanyId = (companyName: string, uid: string): string => {
  const slug = companyName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
  return `cmp_${slug}_${uid.slice(0, 6)}`;
};

// ─── Company Service ──────────────────────────────────────────────────────────

export const CompanyService = {

  /**
   * Phase 1 — Full tenant onboarding (5 writes):
   *   1. companies/{companyId}
   *   2. companies/{companyId}/users/{uid}
   *   3. companies/{companyId}/warehouses/main_warehouse
   *   4. companies/{companyId}/settings/general
   *   5. companies/{companyId}/settings/roles
   *
   * Caller is responsible for writing users/{uid} via AuthService.register().
   */
  async onboard(input: CreateCompanyInput): Promise<{ companyId: string; company: Company }> {
    const companyId = generateCompanyId(input.companyName, input.ownerId);

    // ── 1. companies/{companyId} ──────────────────────────────
    const TRIAL_DAYS = 30;  // 30-day free trial
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();

    const company: Omit<Company, "id"> = {
      name:               input.companyName,
      slug:               companyId,
      email:              input.ownerEmail,
      phone:              input.phone     ?? "",
      industry:           input.industry  ?? "",
      plan:               input.plan      ?? "starter",
      status:             "trial",
      trialEndsAt,
      subscriptionStatus: "trialing",
      ownerId:            input.ownerId,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };
    await setDoc(doc(db, "companies", companyId), company);
    console.log("✅ [CompanyService] companies/{companyId} written:", companyId);

    // ── 2. companies/{companyId}/users/{uid} ──────────────────
    await CompanyUserService.create({
      uid:         input.ownerId,
      email:       input.ownerEmail,
      displayName: input.ownerName,
      companyId,
      role:        "company_owner",
      permissions: DEFAULT_PERMISSIONS["company_owner"],
    });

    // ── 3. companies/{companyId}/warehouses/main_warehouse ─────
    await WarehouseService.create({
      companyId,
      createdBy:  input.ownerId,
      name:       "Main Warehouse",
      code:       "WH-001",
      isDefault:  true,
    });

    // ── 4. companies/{companyId}/settings/general ─────────────
    await setDoc(doc(db, "companies", companyId, "settings", "general"), {
      companyName:   input.companyName,
      currency:      "USD",
      timezone:      "UTC",
      lowStockAlert: 10,
      updatedAt:     new Date(),
    });
    console.log("✅ [CompanyService] settings/general written");

    // ── 5. companies/{companyId}/settings/roles ───────────────
    await setDoc(doc(db, "companies", companyId, "settings", "roles"), {
      roles: {
        company_owner: { displayName: "Owner",         permissions: DEFAULT_PERMISSIONS["company_owner"] },
        company_admin: { displayName: "Admin",         permissions: DEFAULT_PERMISSIONS["company_admin"] },
        staff:         { displayName: "Staff",         permissions: DEFAULT_PERMISSIONS["staff"]         },
      },
      updatedAt: new Date(),
    });
    console.log("✅ [CompanyService] settings/roles written");

    return { companyId, company: { id: companyId, ...company } };
  },

  /** Fetch companies/{companyId} */
  async get(companyId: string): Promise<Company> {
    const snap = await getDoc(doc(db, "companies", companyId));
    if (!snap.exists()) throw new Error(`Company not found: ${companyId}`);
    return { id: snap.id, ...snap.data() } as Company;
  },

  /** Update companies/{companyId} */
  async update(companyId: string, updates: Partial<Company>): Promise<void> {
    await updateDoc(doc(db, "companies", companyId), { ...updates, updatedAt: new Date() });
  },

  /** Update subscription plan */
  async updatePlan(companyId: string, plan: SubscriptionPlan): Promise<void> {
    await updateDoc(doc(db, "companies", companyId), { plan, updatedAt: new Date() });
    console.log(`✅ [CompanyService] Plan updated to "${plan}" for ${companyId}`);
  },

  /** Delete companies/{companyId} — super admin only */
  async delete(companyId: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId));
  },

  /** List all companies — super admin only */
  async listAll(): Promise<Company[]> {
    const snap = await getDocs(collection(db, "companies"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
  },
};
