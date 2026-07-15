/**
 * company-user.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for companies/{companyId}/users/{uid}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  doc, setDoc, getDoc, updateDoc,
  deleteDoc, collection, getDocs,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { auth } from "./firebase";
import db from "./firebase";
import {
  CompanyUser, UserRole, UserPermissions, DEFAULT_PERMISSIONS,
} from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCompanyUserInput {
  uid:                string;
  email:              string;
  displayName:        string;
  companyId:          string;
  role:               UserRole;
  permissions?:       UserPermissions;
  assignedWarehouseId?: string;
}

export interface InviteStaffInput {
  email:              string;
  password:           string;
  displayName:        string;
  companyId:          string;
  role:               UserRole;
  assignedWarehouseId?: string;
}

// ─── Company User Service ─────────────────────────────────────────────────────

export const CompanyUserService = {

  /**
   * Create companies/{companyId}/users/{uid}
   * Used during onboarding and when adding existing users.
   */
  async create(input: CreateCompanyUserInput): Promise<CompanyUser> {
    const data: CompanyUser = {
      uid:                input.uid,
      email:              input.email,
      displayName:        input.displayName,
      companyId:          input.companyId,
      role:               input.role,
      status:             "active",
      permissions:        input.permissions ?? DEFAULT_PERMISSIONS[input.role],
      assignedWarehouseId: input.assignedWarehouseId ?? "",
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };
    await setDoc(
      doc(db, "companies", input.companyId, "users", input.uid),
      data
    );
    console.log(`✅ [CompanyUserService] companies/${input.companyId}/users/${input.uid} written`);
    return data;
  },

  /**
   * Invite a new staff member WITHOUT signing out the current owner.
   * Uses a temporary secondary Firebase app instance so the Auth state
   * of the primary app (the owner's session) is never touched.
   *
   * If the email already has a Firebase Auth account, we skip creation
   * and just write the Firestore docs using the existing uid.
   */
  async invite(input: InviteStaffInput): Promise<CompanyUser> {
    const secondaryAppName = `staff-invite-${Date.now()}`;
    const primaryApp       = getApp();
    const secondaryApp     = initializeApp(primaryApp.options, secondaryAppName);
    const secondaryAuth    = getAuth(secondaryApp);

    let staffUid: string;

    try {
      const existingMethods = await fetchSignInMethodsForEmail(secondaryAuth, input.email);

      if (existingMethods.length > 0) {
        try {
          const { user } = await signInWithEmailAndPassword(
            secondaryAuth,
            input.email,
            input.password
          );
          staffUid = user.uid;
          console.log(`⚠️ [invite] Auth account already exists, reusing uid: ${staffUid}`);
        } catch (signInErr: any) {
          if (signInErr?.code === "auth/wrong-password") {
            throw new Error(
              "This staff email already has an account. Use the correct password or ask the user to reset it before inviting them again."
            );
          }
          throw signInErr;
        }
      } else {
        const { user } = await createUserWithEmailAndPassword(
          secondaryAuth,
          input.email,
          input.password
        );
        staffUid = user.uid;
        console.log(`✅ [invite] Auth account created: ${staffUid}`);
      }
    } finally {
      if (secondaryAuth.currentUser) {
        await signOut(secondaryAuth).catch(() => undefined);
      }
      await deleteApp(secondaryApp);
    }

    const permissions = DEFAULT_PERMISSIONS[input.role];

    const profileData = {
      uid:                staffUid,
      email:              input.email,
      displayName:        input.displayName,
      companyId:          input.companyId,
      role:               input.role,
      status:             "active",
      isSuperAdmin:       false,
      permissions,
      assignedWarehouseId: input.assignedWarehouseId ?? "",
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };

    await setDoc(doc(db, "users", staffUid), profileData, { merge: true });

    return CompanyUserService.create({
      uid:                staffUid,
      email:              input.email,
      displayName:        input.displayName,
      companyId:          input.companyId,
      role:               input.role,
      permissions,
      assignedWarehouseId: input.assignedWarehouseId,
    });
  },

  /** Fetch a single company user */
  async get(companyId: string, uid: string): Promise<CompanyUser> {
    const snap = await getDoc(doc(db, "companies", companyId, "users", uid));
    if (!snap.exists()) throw new Error(`Company user not found: ${uid}`);
    return { ...snap.data(), uid: snap.id } as CompanyUser;
  },

  /** List all users in a company */
  async list(companyId: string): Promise<CompanyUser[]> {
    const snap = await getDocs(collection(db, "companies", companyId, "users"));
    return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as CompanyUser));
  },

  /** Update role + permissions */
  async updateRole(companyId: string, uid: string, role: UserRole): Promise<void> {
    const permissions = DEFAULT_PERMISSIONS[role];
    const updates = { role, permissions, updatedAt: new Date() };
    await updateDoc(doc(db, "companies", companyId, "users", uid), updates);
    await updateDoc(doc(db, "users", uid), updates);
    console.log(`✅ [CompanyUserService] Role updated to "${role}" for ${uid}`);
  },

  /** Toggle active / inactive status */
  async toggleStatus(companyId: string, uid: string, current: string): Promise<void> {
    const status = current === "active" ? "inactive" : "active";
    const updates = { status, updatedAt: new Date() };
    await updateDoc(doc(db, "companies", companyId, "users", uid), updates);
    await updateDoc(doc(db, "users", uid), updates);
  },

  /** Reassign a staff/admin to a specific warehouse */
  async updateWarehouseAssignment(companyId: string, uid: string, assignedWarehouseId?: string): Promise<void> {
    const updates = { assignedWarehouseId: assignedWarehouseId ?? "", updatedAt: new Date() };
    await updateDoc(doc(db, "companies", companyId, "users", uid), updates);
    await updateDoc(doc(db, "users", uid), updates);
    console.log(`✅ [CompanyUserService] Warehouse assignment updated for ${uid}:`, assignedWarehouseId ?? "none");
  },

  /** Remove a staff member from the company subcollection */
  async remove(companyId: string, uid: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId, "users", uid));
    console.log(`✅ [CompanyUserService] Removed ${uid} from ${companyId}`);
  },
};
