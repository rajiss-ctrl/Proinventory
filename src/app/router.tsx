import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import RootLayout        from "../components/layout/RootLayout";
import ProtectedRoute    from "./ProtectedRoute";
import RoleRoute         from "./RoleRoute";
import LoadingSpinner    from "../components/ui/LoadingSpinner";

/* ── Public pages ── */
const HomePage          = lazy(() => import("../pages/HomePage"));
const LoginPage         = lazy(() => import("../pages/LoginPage"));
const RegisterPage      = lazy(() => import("../pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const NotFoundPage      = lazy(() => import("../pages/NotFoundPage"));

/* ── Authenticated pages (role-specific) ── */
const SuperAdminPage      = lazy(() => import("../pages/SuperAdminPage"));
const OwnerDashboardPage  = lazy(() => import("../pages/OwnerDashboardPage"));
const DashboardPage       = lazy(() => import("../pages/DashboardPage"));
const BusinessProfilePage = lazy(() => import("../pages/BusinessProfilePage"));

const AppRouter = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route element={<RootLayout />}>

        {/* ── Public ── */}
        <Route index          element={<HomePage />} />
        <Route path="login"   element={<LoginPage />} />
        <Route path="register"element={<RegisterPage />} />
        <Route path="reset"   element={<ResetPasswordPage />} />

        {/* ── Authenticated ── */}
        <Route element={<ProtectedRoute />}>

          {/* Super Admin only */}
          <Route element={<RoleRoute allow={["super_admin"]} redirectTo="/dashboard" />}>
            <Route path="superadmin" element={<SuperAdminPage />} />
          </Route>

          {/* Business Owner + Company Admin + Guest (= company management access) */}
          <Route element={<RoleRoute allow={["company_owner", "company_admin", "guest"]} redirectTo="/dashboard" />}>
            <Route path="owner"            element={<OwnerDashboardPage />} />
            <Route path="business-profile" element={<BusinessProfilePage />} />
          </Route>

          {/* All authenticated users — role-aware rendering inside */}
          <Route path="dashboard" element={<DashboardPage />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
