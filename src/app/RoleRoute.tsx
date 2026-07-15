import { Navigate, Outlet } from "react-router-dom";
import useAppSelector from "../hooks/useAppSelector";
import type { UserRole } from "../types";
import LoadingSpinner from "../components/ui/LoadingSpinner";

interface RoleRouteProps {
  allow: UserRole[];
  redirectTo?: string;
}

/**
 * RoleRoute — gates a route by role.
 *
 * Rules:
 * - While auth status is "loading" (profile fetch in progress) → show spinner
 * - super_admin always passes through
 * - guest role is treated identically to company_owner
 */
const RoleRoute = ({ allow, redirectTo = "/dashboard" }: RoleRouteProps) => {
  const user       = useAppSelector((s) => s.auth.user);
  const profile    = useAppSelector((s) => s.auth.profile);
  const authStatus = useAppSelector((s) => s.auth.status);

  // Wait for the authoritative profile role before making a route decision.
  const role = (profile?.role as UserRole | undefined) ?? (user?.role as UserRole | undefined);

  if (!role && authStatus === "loading") {
    return <LoadingSpinner />;
  }

  // No role resolved at all yet — wait
  if (!role && authStatus === "idle") {
    return <LoadingSpinner />;
  }

  const effectiveRole = role ?? "staff";

  const permitted =
    effectiveRole === "super_admin" ||  // super admin bypasses all guards
    allow.includes(effectiveRole);

  return permitted
    ? <Outlet />
    : <Navigate to={redirectTo} replace />;
};

export default RoleRoute;
