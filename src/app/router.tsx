import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import RootLayout from "../components/layout/RootLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const HomePage           = lazy(() => import("../pages/HomePage"));
const LoginPage          = lazy(() => import("../pages/LoginPage"));
const RegisterPage       = lazy(() => import("../pages/RegisterPage"));
const ResetPasswordPage  = lazy(() => import("../pages/ResetPasswordPage"));
const DashboardPage      = lazy(() => import("../pages/DashboardPage"));
const BusinessProfilePage = lazy(() => import("../pages/BusinessProfilePage"));
const NotFoundPage       = lazy(() => import("../pages/NotFoundPage"));

const AppRouter = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="reset" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="business-profile" element={<BusinessProfilePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
