/**
 * subscription.service.ts
 * Manages subscription plan changes for a company.
 */
import { doc, updateDoc, getDoc } from "firebase/firestore";
import db from "./firebase";
import { SubscriptionPlan, PLANS, Company } from "../types";

export const SubscriptionService = {

  async get(companyId: string): Promise<SubscriptionPlan> {
    const snap = await getDoc(doc(db, "companies", companyId));
    if (!snap.exists()) throw new Error("Company not found");
    return snap.data().plan as SubscriptionPlan;
  },

  async upgrade(companyId: string, plan: SubscriptionPlan): Promise<void> {
    await updateDoc(doc(db, "companies", companyId), {
      plan,
      status:             "active",   // exit trial state
      subscriptionStatus: "active",   // mark as paid
      updatedAt:          new Date(),
    });
    console.log(`✅ [SubscriptionService] ${companyId} upgraded to "${plan}" — status: active`);
  },

  getPlanDetails(plan: SubscriptionPlan) {
    return PLANS.find((p) => p.id === plan) ?? PLANS[0];
  },

  isFeatureAllowed(plan: SubscriptionPlan, feature: "multiWarehouse" | "advancedReports" | "api"): boolean {
    const limits: Record<SubscriptionPlan, Record<string, boolean>> = {
      starter:      { multiWarehouse: false, advancedReports: false, api: false },
      most_popular: { multiWarehouse: true,  advancedReports: true,  api: true  },
      enterprise:   { multiWarehouse: true,  advancedReports: true,  api: true  },
    };
    return limits[plan]?.[feature] ?? false;
  },
};
