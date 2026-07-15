/**
 * TrialBanner — shows at the top of the owner dashboard during a trial.
 * Hidden for: guests, subscribed companies, super admins.
 * Turns amber when ≤ 3 days left. Red when expired.
 */
import { useNavigate } from "react-router-dom";
import useCompanyAccess from "../../hooks/useCompanyAccess";

const TrialBanner = () => {
  const navigate = useNavigate();
  const { isTrial, isSubscribed, daysLeft, isExpired, isGuest } =
    useCompanyAccess();

  // Never show for guests or already-subscribed companies
  if (isGuest || isSubscribed || !isTrial) return null;

  const urgent  = (daysLeft ?? 0) <= 3 && !isExpired;
  const expired = isExpired;

  const bgColor = expired
    ? "var(--color-danger-soft)"
    : urgent
    ? "var(--color-warning-soft)"
    : "var(--color-info-soft)";

  const textColor = expired
    ? "var(--color-danger)"
    : urgent
    ? "var(--color-warning)"
    : "var(--color-info)";

  const borderColor = expired
    ? "var(--color-danger-border)"
    : urgent
    ? "var(--color-warning-border)"
    : "var(--color-info-border)";

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 text-xs"
      style={{
        background:   bgColor,
        borderBottom: `1px solid ${borderColor}`,
        color:        textColor,
      }}
    >
      <span className="font-medium">
        {expired
          ? "⚠️ Your free trial has expired. Upgrade to continue using ProInventory."
          : `🎉 Free trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining. Upgrade to keep full access after it ends.`}
      </span>
      <button
        onClick={() => navigate("/owner?tab=plan")}
        className="ml-4 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all"
        style={{ background: textColor, color: "white" }}
      >
        {expired ? "Upgrade Now" : "View Plans"}
      </button>
    </div>
  );
};

export default TrialBanner;
