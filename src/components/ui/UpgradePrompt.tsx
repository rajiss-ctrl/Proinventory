/**
 * UpgradePrompt — full-panel overlay shown when trial expired or suspended.
 * Drop this inside any tab that requires active access.
 *
 * Usage:
 *   const { hasAccess } = useCompanyAccess();
 *   if (!hasAccess) return <UpgradePrompt />;
 */
import { useNavigate } from "react-router-dom";
import useCompanyAccess from "../../hooks/useCompanyAccess";
import { MdLock } from "react-icons/md";

const UpgradePrompt = () => {
  const navigate = useNavigate();
  const { isExpired, isSuspended, isGuest } = useCompanyAccess();

  if (isGuest) return null; // guests never see this

  const title = isSuspended
    ? "Account Suspended"
    : "Your Free Trial Has Ended";

  const message = isSuspended
    ? "Your account has been suspended. Please contact support or upgrade your plan to restore access."
    : "Your 14-day free trial has expired. Subscribe to a plan to continue adding products, managing staff, and accessing all features.";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Lock icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "var(--color-danger-soft)" }}
      >
        <MdLock size={28} style={{ color: "var(--color-danger)" }} />
      </div>

      <h2
        className="text-xl font-extrabold mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>

      <p
        className="text-sm leading-relaxed max-w-md mb-8"
        style={{ color: "var(--color-text-muted)" }}
      >
        {message}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate("/owner?tab=plan")}
          className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--color-brand-primary)",
            color: "white",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          View Subscription Plans
        </button>
        <a
          href="mailto:support@proinventory.com"
          className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "transparent",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border-medium)",
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default UpgradePrompt;
