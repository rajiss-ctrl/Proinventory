import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { auth } from "../services/firebase";
import { setCurrentUser, fetchUserProfile } from "../features/auth/authSlice";
import AuthLeftPanel from "../components/layout/AuthLeftPanel";

/* ─── Types ─────────────────────────────────────────────── */
interface LoginForm {
  email: string;
  password: string;
}

const schema = yup.object({
  email:    yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Min 6 characters").required("Password is required"),
});

/* ─── Constants ─────────────────────────────────────────── */
const GUEST = { email: import.meta.env.VITE_GUEST_EMAIL as string, pass: import.meta.env.VITE_GUEST_PASSWORD as string };

const INPUT_BASE =
  "w-full rounded-xl px-4 py-3 pl-11 text-sm outline-none transition-all";

const INPUT_STYLE = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-input-border)",
  color: "var(--color-input-text)",
};

/* ─── Social Button ─────────────────────────────────────── */
const SocialBtn = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50 flex-1"
    style={{
      background: "var(--color-surface-3)",
      border: "1px solid var(--color-border-medium)",
      color: "var(--color-text-secondary)",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-brand)";
      (e.currentTarget as HTMLElement).style.background  = "var(--color-surface-4)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-medium)";
      (e.currentTarget as HTMLElement).style.background  = "var(--color-surface-3)";
    }}
  >
    {icon}
    {label}
  </button>
);

/* ─── Page ───────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [serverErr,  setServerErr]  = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: yupResolver(schema) });

  /* ── Core login helper ── */
  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const payload  = { uid: user.uid, email: user.email ?? "" };
    dispatch(setCurrentUser(payload));
    if (remember) localStorage.setItem("currentUser", JSON.stringify(payload));
    else          sessionStorage.setItem("currentUser", JSON.stringify(payload));
    // Fetch users/{uid} to get companyId → triggers App.tsx company listeners
    dispatch(fetchUserProfile(user.uid));
    console.log("✅ [Login] Signed in, fetching user profile for uid:", user.uid);
    navigate("/dashboard");
  };

  /* ── Email / password submit ── */
  const onSubmit = async (data: LoginForm) => {
    setLoading(true); setServerErr("");
    try   { await login(data.email, data.password); }
    catch { setServerErr("Incorrect email or password. Please try again."); }
    finally { setLoading(false); }
  };

  /* ── Guest login ── */
  const handleGuest = async () => {
    setLoading(true);
    setServerErr("");
    try {
      const { user } = await signInWithEmailAndPassword(auth, GUEST.email, GUEST.pass);

      // Set role: "guest" BEFORE navigating — RoleRoute reads this immediately
      const payload = {
        uid:         user.uid,
        email:       user.email ?? "",
        role:        "guest" as const,
        companyId:   `guest_company_${user.uid}`,
        displayName: "Guest User",
        isSuperAdmin: false,
      };
      dispatch(setCurrentUser(payload));
      sessionStorage.setItem("currentUser", JSON.stringify(payload));

      // Do NOT call fetchUserProfile for guest — it has no users/{uid} doc
      // and would overwrite the guest role we just set.
      console.log("✅ [Guest] Signed in as guest, role: guest → /owner");
      navigate("/owner");
    } catch (err) {
      console.error("❌ [Guest] Login failed:", err);
      setServerErr("Guest login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Google sign-in ── */
  const handleGoogle = async () => {
    setLoading(true); setServerErr("");
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const payload  = { uid: user.uid, email: user.email ?? "" };
      dispatch(setCurrentUser(payload));
      sessionStorage.setItem("currentUser", JSON.stringify(payload));
      navigate("/dashboard");
    } catch {
      setServerErr("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-app)" }}
    >
      <div
        className="w-full max-w-5xl rounded-2xl overflow-hidden grid lg:grid-cols-2 min-h-[600px]"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-soft)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* ── Left panel ── */}
        <AuthLeftPanel variant="login" />

        {/* ── Right panel ── */}
        <div
          className="flex flex-col justify-between p-8 sm:p-10 overflow-y-auto"
          style={{ background: "var(--color-surface-2)" }}
        >
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">

            {/* Heading */}
            <div className="text-center mb-8">
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Glad to see you again! Please login to your account.
              </p>
            </div>

            {/* Error banner */}
            {serverErr && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--color-danger-soft)",
                  border: "1px solid var(--color-danger-border)",
                  color: "var(--color-danger)",
                }}
              >
                {serverErr}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Email */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <MdEmail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--color-input-icon)" }}
                  />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className={INPUT_BASE}
                    style={INPUT_STYLE}
                    onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border-focus)")}
                    onBlur={(e)  => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border)")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <MdLock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--color-input-icon)" }}
                  />
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${INPUT_BASE} pr-12`}
                    style={INPUT_STYLE}
                    onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border-focus)")}
                    onBlur={(e)  => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-input-icon)" }}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Remember me
                  </span>
                </label>
                <Link
                  to="/reset"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--color-brand-primary-soft)" }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Log In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{
                  background: "var(--color-brand-primary)",
                  color: "white",
                  boxShadow: "var(--shadow-glow)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-brand-primary-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-brand-primary)")}
              >
                {loading ? "Signing in…" : "Log In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--color-border-soft)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                or continue with
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--color-border-soft)" }} />
            </div>

            {/* Social buttons */}
            <div className="flex gap-3 mb-4">
              <SocialBtn
                icon={<FcGoogle size={18} />}
                label="Google"
                onClick={handleGoogle}
                disabled={loading}
              />
              <SocialBtn
                icon={
                  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                    <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" fill="#F25022"/>
                    <path d="M11 0h10v10H11V0z" fill="#7FBA00"/>
                    <path d="M0 11h10v10H0V11z" fill="#00A4EF"/>
                    <path d="M11 11h10v10H11V11z" fill="#FFB900"/>
                  </svg>
                }
                label="Microsoft"
                onClick={() => {}}
                disabled={loading}
              />
              <SocialBtn
                icon={
                  <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-155.5-127.4C46.9 681.8 1 529.4 1 385.8c0-196.6 127.5-300.4 251.9-300.4 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2z" />
                  </svg>
                }
                label="Apple"
                onClick={() => {}}
                disabled={loading}
              />
            </div>

            {/* Guest login */}
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 mb-5"
              style={{
                background: "transparent",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-medium)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-brand)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-medium)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
              }}
            >
              {loading ? "Please wait…" : "👤 Continue as Guest"}
            </button>

            {/* Sign up link */}
            <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: "var(--color-brand-primary-soft)" }}
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: "var(--color-text-faint)" }}>
            © {new Date().getFullYear()} ProInventory. All rights reserved. Built by{" "}
            <a
              href="https://github.com/rajiss-ctrl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors"
              style={{ color: "var(--color-brand-primary-soft)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--color-brand-primary-soft)")
              }
            >
              RajisSaraF.Dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
