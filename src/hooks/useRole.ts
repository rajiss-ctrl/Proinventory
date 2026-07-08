import useAppSelector from "./useAppSelector";
import type { UserRole } from "../types";

/**
 * useRole — central role/permission helper hook.
 *
 * Usage:
 *   const { isSuperAdmin, isOwner, canWrite, canDelete } = useRole();
 */
const useRole = () => {
  const user    = useAppSelector((s) => s.auth.user);
  const profile = useAppSelector((s) => s.auth.profile);

  const role: UserRole =
    // Priority: user.role (set immediately on login) > profile.role (async fetch) > default
    (user?.role as UserRole) ??
    (profile?.role as UserRole) ??
    "staff";
  const perms          = profile?.permissions;

  /* ── Role booleans ── */
  const isSuperAdmin   = role === "super_admin"   || !!user?.isSuperAdmin;
  const isOwner        = role === "company_owner" || role === "guest";
  const isAdmin        = role === "company_admin";
  const isStaff        = role === "staff";
  const isGuest        = role === "guest";
  const isOwnerOrAdmin = isOwner || isAdmin;

  /* ── Permission helpers ── */
  const canRead   = (mod: keyof NonNullable<typeof perms>) =>
    isSuperAdmin || isOwner || !!(perms?.[mod] as any)?.read;

  const canWrite  = (mod: keyof NonNullable<typeof perms>) =>
    isSuperAdmin || isOwner || !!(perms?.[mod] as any)?.write;

  const canDelete = (mod: keyof NonNullable<typeof perms>) =>
    isSuperAdmin || isOwner || !!(perms?.[mod] as any)?.delete;

  /* ── Product-specific shortcuts used across the dashboard ── */
  const canAddProduct    = canWrite("products");
  const canEditProduct   = isSuperAdmin || isOwnerOrAdmin;
  const canDeleteProduct = isSuperAdmin || isOwner;
  const canManageUsers   = isSuperAdmin || isOwnerOrAdmin;
  const canViewReports   = isSuperAdmin || isOwnerOrAdmin;
  const canManageSettings = isSuperAdmin || isOwner;

  return {
    role,
    isSuperAdmin,
    isOwner,
    isAdmin,
    isStaff,
    isGuest,
    isOwnerOrAdmin,
    canRead,
    canWrite,
    canDelete,
    canAddProduct,
    canEditProduct,
    canDeleteProduct,
    canManageUsers,
    canViewReports,
    canManageSettings,
    user,
    profile,
  };
};

export default useRole;
