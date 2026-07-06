import { useState } from "react";
import { MdSearch, MdNotifications, MdHelp } from "react-icons/md";
import { FiMenu } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import GuestAvatar from "../../assets/img/guest.png";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const [search, setSearch] = useState("");
  const authUser = useSelector((s: RootState) => s.auth.user);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 flex items-center gap-4 px-5 h-14"
      style={{
        background: "var(--color-bg-header)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* Hamburger (shifts with sidebar) */}
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
        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-soft)",
          }}
          aria-label="Notifications"
        >
          <MdNotifications size={18} />
          <span
            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full"
            style={{ background: "var(--color-danger)", color: "white" }}
          >
            3
          </span>
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
            style={{ ringColor: "var(--color-border-brand)" }}
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
