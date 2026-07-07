import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import {
  MdPerson, MdEmail, MdLock, MdBusiness,
  MdPhone, MdPeople, MdVisibility, MdVisibilityOff, MdShield,
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import db, { auth } from "../services/firebase";
import { setCurrentUser } from "../features/auth/authSlice";
import { useDispatch } from "react-redux";
import AuthLeftPanel from "../components/layout/AuthLeftPanel";

/* ─── Types ──────────────────────────────────────────────── */
interface RegisterForm {
  fullName:     string;
  email:        string;
  password:     string;
  confirmPass:  string;
  company:      string;
  phone:        string;
  role:         string;
}

const ROLES = [
  "Business Owner",
  "Inventory Manager",
  "Warehouse Staff",
  "Sales Manager",
  "Procurement Officer",
  "Other",
];

/* ─── Password strength ──────────────────────────────────── */
const getStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;

  if (score <= 1) return { score, label: "Weak",   color: "var(--color-danger)"  };
  if (score === 2) return { score, label: "Fair",   color: "var(--color-warning)" };
  if (score === 3) return { score, label: "Good",   color: "var(--color-info)"    };
  return               { score, label: "Strong", color: "var(--color-success)"  };
};

/* ─── Shared styles ──────────────────────────────────────── */
const INPUT_BASE =
  "w-full rounded-xl px-4 py-3 pl-10 text-sm outline-none transition-all";
const INPUT_STYLE = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-input-border)",
  color: "var(--color-input-text)",
};

/* ─── Social Button ──────────────────────────────────────── */
const SocialBtn = ({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50 flex-1"
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
    {icon} {label}
  </button>
);

/* ─── Field wrapper ──────────────────────────────────────── */
const Field = ({
  label, icon, error, children,
}: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
      {label}
    </label>
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--color-input-icon)" }}
      >
        {icon}
      </span>
      {children}
    </div>
    {error && (
      <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>
        {error}
      </p>
    )}
  </div>
);

/* ─── Page ───────────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState<RegisterForm>({
    fullName: "", email: "", password: "", confirmPass: "",
    company: "", phone: "", role: "",
  });
  const [showPass,   setShowPass]   = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [agreed,     setAgreed]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<Partial<RegisterForm & { agree: string }>>({});
  const [serverErr,  setServerErr]  = useState("");

  const strength = getStrength(form.password);

  const set = (field: keyof RegisterForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  /* ── Validation ── */
  const validate = () => {
    const e: typeof errors = {};
    if (!form.fullName.trim())             e.fullName    = "Full name is required.";
    if (!form.email.trim())                e.email       = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = "Invalid email format.";
    if (form.password.length < 8)          e.password    = "Min 8 characters.";
    if (form.password !== form.confirmPass) e.confirmPass = "Passwords do not match.";
    if (!agreed)                           e.agree       = "You must accept the terms.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setServerErr("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await addDoc(collection(db, "users"), {
        uid:          user.uid,
        fullName:     form.fullName,
        email:        form.email,
        company:      form.company,
        phone:        form.phone,
        role:         form.role,
        authProvider: "local",
        createdAt:    new Date(),
      });
      dispatch(setCurrentUser({ uid: user.uid, email: user.email ?? "" }));
      sessionStorage.setItem("currentUser", JSON.stringify({ uid: user.uid, email: user.email }));
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setServerErr("This email is already registered. Try logging in.");
      } else {
        setServerErr("Registration failed. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google sign-up ── */
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

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
      ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border-focus)"),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
      ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border)"),
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-app)" }}
    >
      <div
        className="w-full max-w-6xl rounded-2xl overflow-hidden grid lg:grid-cols-2"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-soft)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* ── Left panel ── */}
        <AuthLeftPanel variant="register" />

        {/* ── Right panel ── */}
        <div
          className="flex flex-col p-8 sm:p-10 overflow-y-auto"
          style={{ background: "var(--color-surface-2)" }}
        >
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--color-text-primary)" }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold"
                style={{ color: "var(--color-brand-primary-soft)" }}
              >
                Sign in
              </Link>
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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Row: Full Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" icon={<MdPerson size={15} />} error={errors.fullName}>
                <input
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="Enter your full name"
                  className={INPUT_BASE}
                  style={INPUT_STYLE}
                  {...focusStyle}
                />
              </Field>
              <Field label="Email Address" icon={<MdEmail size={15} />} error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={INPUT_BASE}
                  style={INPUT_STYLE}
                  {...focusStyle}
                />
              </Field>
            </div>

            {/* Password */}
            <Field label="Password" icon={<MdLock size={15} />} error={errors.password}>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={`${INPUT_BASE} pr-12`}
                style={INPUT_STYLE}
                {...focusStyle}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-input-icon)" }}
                aria-label="Toggle password visibility"
              >
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </Field>

            {/* Password strength bar */}
            {form.password && (
              <div className="-mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background: i <= strength.score ? strength.color : "var(--color-surface-4)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                  Use 8+ characters with a mix of letters, numbers &amp; symbols
                </p>
              </div>
            )}

            {/* Confirm Password */}
            <Field label="Confirm Password" icon={<MdLock size={15} />} error={errors.confirmPass}>
              <input
                type={showConf ? "text" : "password"}
                value={form.confirmPass}
                onChange={set("confirmPass")}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={`${INPUT_BASE} pr-12`}
                style={INPUT_STYLE}
                {...focusStyle}
              />
              <button
                type="button"
                onClick={() => setShowConf((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-input-icon)" }}
                aria-label="Toggle confirm password visibility"
              >
                {showConf ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </Field>

            {/* Row: Company + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company Name" icon={<MdBusiness size={15} />}>
                <input
                  value={form.company}
                  onChange={set("company")}
                  placeholder="Enter your company name"
                  className={INPUT_BASE}
                  style={INPUT_STYLE}
                  {...focusStyle}
                />
              </Field>
              <Field label="Phone Number" icon={<MdPhone size={15} />}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="Enter your phone number"
                  className={INPUT_BASE}
                  style={INPUT_STYLE}
                  {...focusStyle}
                />
              </Field>
            </div>

            {/* Role */}
            <Field label="Role" icon={<MdPeople size={15} />}>
              <select
                value={form.role}
                onChange={set("role")}
                className={`${INPUT_BASE} appearance-none`}
                style={{ ...INPUT_STYLE, paddingRight: "2.5rem" }}
                {...focusStyle}
              >
                <option value="" disabled>Select your role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                style={{ color: "var(--color-input-icon)" }}
              >▾</span>
            </Field>

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0"
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  I agree to the{" "}
                  <a href="#" className="font-semibold underline" style={{ color: "var(--color-brand-primary-soft)" }}>
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold underline" style={{ color: "var(--color-brand-primary-soft)" }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agree && (
                <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>
                  {errors.agree}
                </p>
              )}
            </div>

            {/* Submit */}
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--color-border-soft)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border-soft)" }} />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3 mb-5">
            <SocialBtn
              icon={<FcGoogle size={17} />}
              label="Google"
              onClick={handleGoogle}
              disabled={loading}
            />
            <SocialBtn
              icon={
                <svg width="17" height="17" viewBox="0 0 21 21" fill="none">
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
                <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor" style={{ color: "var(--color-text-secondary)" }}>
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-155.5-127.4C46.9 681.8 1 529.4 1 385.8c0-196.6 127.5-300.4 251.9-300.4 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2z" />
                </svg>
              }
              label="Apple"
              onClick={() => {}}
              disabled={loading}
            />
          </div>

          {/* Security note */}
          <p
            className="flex items-center justify-center gap-1.5 text-xs"
            style={{ color: "var(--color-text-faint)" }}
          >
            <MdShield size={13} />
            Your data is secure with us. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
