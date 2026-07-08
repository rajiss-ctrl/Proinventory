import { useEffect, useState } from "react";
import {
  collection, getDocs, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import {
  MdPeople, MdBusiness, MdBlock, MdCheckCircle,
  MdDelete, MdRefresh, MdSearch, MdLogout,
} from "react-icons/md";
import db, { logOut } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { UserProfile, Company, SubscriptionPlan, PLANS } from "../types";
import Logo from "../assets/img/stocktrack-logo.png";

/* ─── Plan badge ─────────────────────────────────────────── */
const planStyle: Record<SubscriptionPlan, { bg: string; text: string; label: string }> = {
  starter:      { bg: "var(--color-surface-3)",      text: "var(--color-text-muted)",        label: "Starter" },
  most_popular: { bg: "var(--color-nav-active-bg)",  text: "var(--color-brand-primary-soft)", label: "Most Popular" },
  enterprise:   { bg: "var(--color-warning-soft)",   text: "var(--color-warning)",            label: "Enterprise" },
};

const PlanBadge = ({ plan }: { plan: SubscriptionPlan }) => {
  const s = planStyle[plan] ?? planStyle.starter;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
};

const statusStyle = (status: string) =>
  status === "active"
    ? { bg: "var(--color-stock-in-soft)",  text: "var(--color-stock-in)"  }
    : { bg: "var(--color-danger-soft)",    text: "var(--color-danger)"    };

/* ─── Page ───────────────────────────────────────────────── */
type Tab = "users" | "companies";

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const [tab,       setTab      ] = useState<Tab>("users");
  const [users,     setUsers    ] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search,    setSearch   ] = useState("");
  const [loading,   setLoading  ] = useState(true);

  const load = async () => {
    setLoading(true);
    const [uSnap, cSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "companies")),
    ]);
    setUsers    (uSnap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile)));
    setCompanies(cSnap.docs.map((d) => ({ ...d.data(), id:  d.id } as Company)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* ── Actions ── */
  const toggleStatus = async (uid: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "users", uid), { status: next, updatedAt: new Date() });
    setUsers((p) => p.map((u) => u.uid === uid ? { ...u, status: next as any } : u));
  };

  const deleteUser = async (uid: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    await deleteDoc(doc(db, "users", uid));
    setUsers((p) => p.filter((u) => u.uid !== uid));
  };

  const toggleCompanyStatus = async (id: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "companies", id), { status: next, updatedAt: new Date() });
    setCompanies((p) => p.map((c) => c.id === id ? { ...c, status: next as any } : c));
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete this company and all its data? This cannot be undone.")) return;
    await deleteDoc(doc(db, "companies", id));
    setCompanies((p) => p.filter((c) => c.id !== id));
  };

  /* ── Filter ── */
  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCompanies = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Stats ── */
  const stats = [
    { label: "Total Users",     value: users.length,                            icon: <MdPeople />,   color: "var(--color-brand-primary-soft)" },
    { label: "Active Users",    value: users.filter((u) => u.status === "active").length, icon: <MdCheckCircle />, color: "var(--color-success)" },
    { label: "Total Companies", value: companies.length,                         icon: <MdBusiness />, color: "var(--color-info)" },
    { label: "Starter Plans",   value: companies.filter((c) => c.plan === "starter").length,      icon: <MdBusiness />, color: "var(--color-text-muted)" },
    { label: "Pro Plans",       value: companies.filter((c) => c.plan === "most_popular").length, icon: <MdBusiness />, color: "var(--color-brand-primary-soft)" },
    { label: "Enterprise",      value: companies.filter((c) => c.plan === "enterprise").length,   icon: <MdBusiness />, color: "var(--color-warning)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-app)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 h-14"
        style={{ background: "var(--color-bg-header)", borderBottom: "1px solid var(--color-border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <img src={Logo} alt="ProInventory" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            Super<span style={{ color: "var(--color-brand-primary-soft)" }}>Admin</span>
          </span>
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
          >
            Platform Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)" }}
          >
            <MdRefresh size={14} /> Refresh
          </button>
          <button
            onClick={async () => { await logOut(); navigate("/login"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)", border: "1px solid var(--color-danger-border)" }}
          >
            <MdLogout size={14} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
            >
              <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-soft)" }}
          >
            {(["users", "companies"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                style={
                  tab === t
                    ? { background: "var(--color-brand-primary)", color: "white" }
                    : { color: "var(--color-text-muted)" }
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl w-full sm:w-72"
            style={{ background: "var(--color-input-bg)", border: "1px solid var(--color-input-border)" }}
          >
            <MdSearch size={16} style={{ color: "var(--color-input-icon)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab}…`}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--color-input-text)" }}
            />
          </div>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-brand-primary)" }} />
          </div>
        ) : tab === "users" ? (

          /* ════ USERS TABLE ════ */
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {["Display Name", "Email", "Role", "Company ID", "Plan", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-faint)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12"
                      style={{ color: "var(--color-text-faint)" }}>No users found.</td></tr>
                  ) : filteredUsers.map((u) => {
                    const ss = statusStyle(u.status);
                    return (
                      <tr
                        key={u.uid}
                        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {u.displayName || "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                            style={{ background: "var(--color-nav-active-bg)", color: "var(--color-brand-primary-soft)" }}
                          >
                            {u.role?.replace("_", " ") ?? "staff"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                          {u.companyId ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const co = companies.find((c) => c.id === u.companyId);
                            return co ? <PlanBadge plan={co.plan} /> : <span style={{ color: "var(--color-text-faint)" }}>—</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                            style={{ background: ss.bg, color: ss.text }}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStatus(u.uid, u.status)}
                              title={u.status === "active" ? "Deactivate" : "Activate"}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                              style={{ background: "var(--color-surface-3)", color: u.status === "active" ? "var(--color-warning)" : "var(--color-success)" }}
                            >
                              {u.status === "active" ? <MdBlock size={14} /> : <MdCheckCircle size={14} />}
                            </button>
                            <button
                              onClick={() => deleteUser(u.uid)}
                              title="Delete user"
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                              style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
                            >
                              <MdDelete size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ════ COMPANIES TABLE ════ */
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {["Company Name", "Email", "Owner ID", "Plan", "Industry", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-faint)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12"
                      style={{ color: "var(--color-text-faint)" }}>No companies found.</td></tr>
                  ) : filteredCompanies.map((c) => {
                    const ss = statusStyle(c.status);
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {c.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{c.email}</td>
                        <td className="px-4 py-3 font-mono text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                          {c.ownerId?.slice(0, 12)}…
                        </td>
                        <td className="px-4 py-3"><PlanBadge plan={c.plan} /></td>
                        <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>{c.industry || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                            style={{ background: ss.bg, color: ss.text }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCompanyStatus(c.id, c.status)}
                              title={c.status === "active" ? "Suspend" : "Activate"}
                              className="w-7 h-7 flex items-center justify-center rounded-lg"
                              style={{ background: "var(--color-surface-3)", color: c.status === "active" ? "var(--color-warning)" : "var(--color-success)" }}
                            >
                              {c.status === "active" ? <MdBlock size={14} /> : <MdCheckCircle size={14} />}
                            </button>
                            <button
                              onClick={() => deleteCompany(c.id)}
                              title="Delete company"
                              className="w-7 h-7 flex items-center justify-center rounded-lg"
                              style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
                            >
                              <MdDelete size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
