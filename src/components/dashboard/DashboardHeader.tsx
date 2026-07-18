import { useState, useEffect, useRef } from "react";
import { MdSearch, MdNotifications, MdHelp } from "react-icons/md";
import { FiMenu } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import GuestAvatar from "../../assets/img/guest.png";
import { NotificationService } from "../../services/notification.service";
import useAppSelector from "../../hooks/useAppSelector";
import { useNavigate } from "react-router-dom";

// ✅ Define Timeout type to avoid NodeJS namespace issue
type Timeout = ReturnType<typeof setTimeout>;

interface DashboardHeaderProps {
  onMenuClick: () => void;
  notificationCount?: number;
  onNotificationCountChange?: (count: number) => void;
  onNotificationClick?: () => void;
}

const DashboardHeader = ({ 
  onMenuClick, 
  notificationCount = 0,
  onNotificationCountChange,
  onNotificationClick,
}: DashboardHeaderProps) => {
  const [search, setSearch] = useState("");
  const [localCount, setLocalCount] = useState(notificationCount);
  // ✅ Remove unused error state
  const authUser = useSelector((s: RootState) => s.auth.user);
  const companyId = useAppSelector(s => s.auth.profile?.companyId ?? s.auth.user?.companyId) ?? "";
  const navigate = useNavigate();
  // ✅ Use the custom Timeout type instead of NodeJS.Timeout
  const intervalRef = useRef<Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Load notification count with retry logic
  const loadCount = async () => {
    if (!companyId) return;
    
    try {
      const count = await NotificationService.getUnreadCount(companyId);
      setLocalCount(count);
      if (onNotificationCountChange) {
        onNotificationCountChange(count);
      }
      retryCount.current = 0; // Reset retry count on success
    } catch (err) {
      console.error("Failed to load notification count:", err);
      
      // Retry with exponential backoff
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount.current}/${maxRetries})`);
        setTimeout(loadCount, delay);
      }
    }
  };

  useEffect(() => {
    if (!companyId) return;
    
    // Initial load
    loadCount();
    
    // Refresh every 60 seconds instead of 30
    intervalRef.current = setInterval(loadCount, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Use localCount if notificationCount is not provided
  const displayCount = notificationCount || localCount;

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate("/dashboard?tab=notifications");
    }
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 flex items-center gap-4 px-5 h-14"
      style={{
        background: "var(--color-bg-header)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors shrink-0"
        style={{ color: "var(--color-text-muted)" }}
        aria-label="Toggle sidebar"
      >
        <FiMenu size={18} />
      </button>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 flex-1 max-w-xl h-9 px-3 rounded-lg"
        style={{
          background: "var(--color-input-bg)",
          border: "1px solid var(--color-input-border)",
        }}
      >
        <MdSearch size={16} style={{ color: "var(--color-input-icon)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, orders, SKUs..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: "var(--color-input-text)",
          }}
        />
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
          style={{
            background: "var(--color-surface-4)",
            color: "var(--color-text-faint)",
            border: "1px solid var(--color-border-soft)",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Notifications with dynamic badge */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-soft)",
          }}
          aria-label="Notifications"
          onClick={handleNotificationClick}
        >
          <MdNotifications size={18} />
          {displayCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1"
              style={{ background: "var(--color-danger)", color: "white" }}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
        </button>

        {/* Help */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-soft)",
          }}
          aria-label="Help"
        >
          <MdHelp size={18} />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2">
          <img
            src={GuestAvatar}
            alt="User"
            className="w-8 h-8 rounded-full object-cover ring-2"
            style={{ borderColor: "var(--color-border-brand)" }}
          />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "var(--color-text-primary)" }}>
              {authUser?.email?.split("@")[0] ?? "John Anderson"}
            </p>
            <p className="text-[10px] leading-none" style={{ color: "var(--color-text-faint)" }}>
              Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;