import { useEffect, useState } from "react";
import {
  collection, getDocs, doc,
  setDoc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  MdPeople, MdAdd, MdBlock, MdCheckCircle, MdDelete,
  MdEdit, MdClose, MdCreditCard, MdDashboard,
} from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import db, { auth } from "../services/firebase";
import useAppSelector from "../hooks/useAppSelector";
import useRole from "../hooks/useRole";
import {
  CompanyUser, UserRole, SubscriptionPlan,
  PLANS, DEFAULT_PERMISSIONS,
} from "../types";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader  from "../components/dashboard/DashboardHeader";
import {
  StatCard, InventoryTurnoverChart,
  CategoryDonutChart, LowStockPanel,
  RecentActivityPanel, ProductsTable,
} from "../components/dashboard/DashboardWidgets";
import AddProductView   from "../components/dashboard/AddProductView";
import StockStateEditor from "../components/dashboard/StockStateEditor";
import {
  MdAttachMoney, MdInventory2,
  MdRemoveShoppingCart, MdShoppingCart, MdAdd as MdAddIcon,
} from "react-icons/md";
import { Product } from "../types";

const SPARKS = {
  value:  [320,380,410,370,450,420,490,510],
  stock:  [300,310,290,320,340,360,330,350],
  out:    [12,8,14,10,18,12,20,15],
  orders: [5,8,6,10,7,9,8,6],
};

const STAFF_ROLES: UserRole[] = ["staff", "company_admin"];

type OTab = "dashboard" | "staff" | "plan";
type DView = "dashboard" | "add-product";

const INPUT_STYLE = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-input-border)",
  color: "var(--color-input-text)",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
};

/* ─── Add Staff Modal ─────────────────────────────────────── */
interface AddStaffModalProps {
  companyId: string;
  onClose: () => void;
  onAdded: () => void;
}
const AddStaffModal = ({ companyId, onClose, onAdded }: AddStaffModalProps) => {
  const [form, setForm]       = useState({ displayName: "", email: "", password: "", role: "staff" as UserRole });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const perms = DEFAULT_PERMISSIONS[form.role];
      const data: Omit<CompanyUser, "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date } = {
        uid: user.uid, email: form.email, displayName: form.displayName,
        companyId, role: form.role, status: "active", permissions: perms,
        createdAt: new Date(), updatedAt: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), { ...data, isSuperAdmin: false });
      await setDoc(doc(db, "companies", companyId, "users", user.uid), data);
      onAdded(); onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to add staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-brand)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Add Staff Member</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}><MdClose size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)", border: "1px solid var(--color-danger-border)" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: "Full Name", key: "displayName", type: "text", placeholder: "Jane Smith" },
            { label: "Email",     key: "email",       type: "email", placeholder: "jane@company.com" },
            { label: "Password",  key: "password",    type: "password", placeholder: "Min 8 characters" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                style={INPUT_STYLE}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              style={INPUT_STYLE}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r === "staff" ? "Staff (Read + Add)" : "Company Admin (Full minus delete)"}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 disabled:opacity-50"
            style={{ background: "var(--color-brand-primary)", color: "white" }}
          >
            {loading ? "Adding…" : "Add Staff Member"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Page ───────────────────────────────────────────────── */
const OwnerDashboardPage = () => {
  const { profile } = useRole();
  const companyId   = useAppSelector((s) => s.auth.user?.companyId) ?? "";
  const company     = useAppSelector((s) => s.company.company);
  const products    = useAppSelector((s) => s.stock.productData);

  const [oTab,          setOTab]          = useState<OTab>("dashboard");
  const [dView,         setDView]         = useState<DView>("dashboard");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [staffList,     setStaffList]     = useState<CompanyUser[]>([]);
  const [showAddStaff,  setShowAddStaff]  = useState(false);
  const [editItemId,    setEditItemId]    = useState<string | null>(null);

  const sideW = sideCollapsed ? 64 : 220;

  const loadStaff = async () => {
    if (!companyId) return;
    const snap = await getDocs(collection(db, "companies", companyId, "users"));
    setStaffList(snap.docs.map((d) => ({ ...d.data(), uid: d.id } as CompanyUser)));
  };

  useEffect(() => { if (oTab === "staff") loadStaff(); }, [oTab, companyId]);

  const toggleStaffStatus = async (uid: string, status: string) => {
    const next = status === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "companies", companyId, "users", uid), { status: next });
    await updateDoc(doc(db, "users", uid), { status: next });
    setStaffList((p) => p.map((u) => u.uid === uid ? { ...u, status: next as any } : u));
  };

  const removeStaff = async (uid: string) => {
    if (!confirm("Remove this staff member?")) return;
    await deleteDoc(doc(db, "companies", companyId, "users", uid));
    setStaffList((p) => p.filter((u) => u.uid !== uid));
  };

  const updateRole = async (uid: string, role: UserRole) => {
    const perms = DEFAULT_PERMISSIONS[role];
    await updateDoc(doc(db, "companies", companyId, "users", uid), { role, permissions: perms });
    await updateDoc(doc(db, "users", uid), { role, permissions: perms });
    setStaffList((p) => p.map((u) => u.uid === uid ? { ...u, role, permissions: perms } : u));
  };

  const updatePlan = async (plan: SubscriptionPlan) => {
    if (!companyId) return;
    await updateDoc(doc(db, "companies", companyId), { plan, updatedAt: new Date() });
  };

  /* Derived metrics */
  const totalValue = products.reduce((a: number, p: Product) => a + (p.stockQuantity ?? 0) * (p.price ?? 0), 0);
  const totalStock = products.reduce((a: number, p: Product) => a + (p.stockQuantity ?? 0), 0);
  const outOfStock = products.filter((p: Product) => (p.stockQuantity ?? 0) === 0).length;
  const lowStock   = products.filter((p: Product) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 10).length;

  const editItem = products.find((p: Product) => p.id === editItemId);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-app)" }}>
      <DashboardSidebar
        onNewItem={() => { setOTab("dashboard"); setDView("add-product"); }}
        collapsed={sideCollapsed}
        onToggleCollapse={() => setSideCollapsed((p) => !p)}
        activeView={dView === "add-product" ? "add-product" : "dashboard"}
      />
      <DashboardHeader onMenuClick={() => setSideCollapsed((p) => !p)} />

      <main className="transition-all duration-300 pt-14 min-h-screen" style={{ marginLeft: `${sideW}px` }}>

        {/* ── Owner tab bar ── */}
        <div
          className="flex items-center gap-1 px-5 pt-5 pb-0"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          {([
            { id: "dashboard", icon: <MdDashboard size={15} />, label: "Dashboard" },
            { id: "staff",     icon: <MdPeople size={15} />,    label: "Staff Management" },
            { id: "plan",      icon: <MdCreditCard size={15} />, label: "Subscription" },
          ] as { id: OTab; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => { setOTab(id); if (id === "dashboard") setDView("dashboard"); }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2"
              style={{
                color:       oTab === id ? "var(--color-brand-primary-soft)" : "var(--color-text-muted)",
                borderColor: oTab === id ? "var(--color-brand-primary-soft)" : "transparent",
                background:  "transparent",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══ DASHBOARD TAB ══ */}
        {oTab === "dashboard" && (
          dView === "add-product" ? (
            <AddProductView onCancel={() => setDView("dashboard")} onSaved={() => setDView("dashboard")} />
          ) : (
            <div className="p-5 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Total Inventory Value" value={products.length > 0 ? `$${totalValue.toLocaleString("en-US",{minimumFractionDigits:2})}` : "$4,289,109.00"} change={5.2} sparkData={SPARKS.value} sparkColor="var(--color-chart-indigo)" iconBg="var(--color-nav-active-bg)" icon={<MdAttachMoney size={18} style={{ color: "var(--color-brand-primary-soft)" }} />} />
                <StatCard title="Stock on Hand"         value={products.length > 0 ? totalStock.toLocaleString() : "32,145"} change={3.7} sparkData={SPARKS.stock} sparkColor="var(--color-chart-green)" iconBg="var(--color-stock-in-soft)"  icon={<MdInventory2 size={18} style={{ color: "var(--color-stock-in)" }} />} />
                <StatCard title="Items Out of Stock"    value={products.length > 0 ? String(outOfStock) : "128"} change={-12.4} sparkData={SPARKS.out} sparkColor="var(--color-chart-red)" iconBg="var(--color-stock-out-soft)" icon={<MdRemoveShoppingCart size={18} style={{ color: "var(--color-stock-out)" }} />} />
                <StatCard title="Pending Orders"        value={products.length > 0 ? String(lowStock) : "56"} change={-8.1} sparkData={SPARKS.orders} sparkColor="var(--color-chart-purple)" iconBg="var(--color-order-pending-soft)" icon={<MdShoppingCart size={18} style={{ color: "var(--color-order-pending)" }} />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2"><InventoryTurnoverChart /></div>
                <CategoryDonutChart />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LowStockPanel />
                <RecentActivityPanel />
              </div>
              <ProductsTable onEdit={(id) => setEditItemId(id)} onAdd={() => setDView("add-product")} />
            </div>
          )
        )}

        {/* ══ STAFF TAB ══ */}
        {oTab === "staff" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Staff Management</h1>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Add, assign roles, activate/deactivate your team members.
                </p>
              </div>
              <button
                onClick={() => setShowAddStaff(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--color-brand-primary)", color: "white" }}
              >
                <MdAdd size={18} /> Add Staff
              </button>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-faint)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12" style={{ color: "var(--color-text-faint)" }}>
                      No staff yet. Add your first team member.
                    </td></tr>
                  ) : staffList.map((u) => (
                    <tr
                      key={u.uid}
                      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {u.displayName}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.uid, e.target.value as UserRole)}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ background: "var(--color-surface-3)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-soft)" }}
                        >
                          {STAFF_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                          style={{
                            background: u.status === "active" ? "var(--color-stock-in-soft)" : "var(--color-danger-soft)",
                            color:      u.status === "active" ? "var(--color-stock-in)"      : "var(--color-danger)",
                          }}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleStaffStatus(u.uid, u.status)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ background: "var(--color-surface-3)", color: u.status === "active" ? "var(--color-warning)" : "var(--color-success)" }}>
                            {u.status === "active" ? <MdBlock size={14} /> : <MdCheckCircle size={14} />}
                          </button>
                          <button onClick={() => removeStaff(u.uid)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                            <MdDelete size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ PLAN TAB ══ */}
        {oTab === "plan" && (
          <div className="p-5">
            <div className="mb-8">
              <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Subscription Plan</h1>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Current plan: <span className="font-semibold capitalize" style={{ color: "var(--color-brand-primary-soft)" }}>
                  {company?.plan?.replace("_", " ") ?? "Starter"}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const active = company?.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className="relative flex flex-col rounded-2xl p-6 transition-all"
                    style={{
                      background: plan.highlighted ? "linear-gradient(160deg,#1e1b4b 0%,#1a2238 100%)" : "var(--color-surface-1)",
                      border: active ? "2px solid var(--color-brand-primary-soft)" : plan.highlighted ? "1px solid var(--color-border-brand-strong)" : "1px solid var(--color-border-soft)",
                      boxShadow: plan.highlighted ? "var(--shadow-glow)" : "none",
                    }}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-brand-primary)", color: "white" }}>
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    {active && (
                      <div className="absolute -top-3.5 right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-stock-in-soft)", color: "var(--color-stock-in)" }}>
                          Current Plan
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-semibold mb-1" style={{ color: plan.highlighted ? "var(--color-brand-primary-soft)" : "var(--color-text-muted)" }}>{plan.name}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>${plan.price}</span>
                      <span className="text-sm ml-1" style={{ color: "var(--color-text-muted)" }}>/{plan.period}</span>
                    </div>
                    <div className="h-px mb-5" style={{ background: "var(--color-border-soft)" }} />
                    <ul className="flex-1 space-y-2.5 mb-6">
                      {plan.features.map((f) => (
                        <li key={f.label} className="flex items-center gap-2.5 text-xs">
                          <FaCheck className="shrink-0 text-[10px]" style={{ color: f.included ? "var(--color-success)" : "var(--color-text-faint)" }} />
                          <span style={{ color: f.included ? "var(--color-text-secondary)" : "var(--color-text-faint)" }}>{f.label}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => updatePlan(plan.id)}
                      disabled={active}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                      style={
                        active
                          ? { background: "var(--color-stock-in-soft)", color: "var(--color-stock-in)" }
                          : plan.highlighted
                          ? { background: "var(--color-brand-primary)", color: "white" }
                          : { background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border-medium)" }
                      }
                    >
                      {active ? "✓ Active Plan" : `Switch to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      {oTab === "dashboard" && dView === "dashboard" && (
        <button
          onClick={() => setDView("add-product")}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold"
          style={{ background: "var(--color-brand-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}
        >
          <MdAddIcon size={20} /> Add Product
        </button>
      )}

      {showAddStaff && (
        <AddStaffModal companyId={companyId} onClose={() => setShowAddStaff(false)} onAdded={loadStaff} />
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <StockStateEditor
            id={editItem.id}
            qty={editItem.stockQuantity ?? editItem.product_Qty ?? 0}
            price={editItem.price ?? editItem.product_Price ?? 0}
            des={editItem.product_description}
            siz={editItem.size ?? "Piece"}
            stockState={0} index={0}
            onClose={() => setEditItemId(null)}
            onDelete={async (e, id) => {
              const { deleteDoc: dd, doc: d } = await import("firebase/firestore");
              const { default: db2 } = await import("../services/firebase");
              await dd(d(db2, "companies", companyId, "products", id));
              setEditItemId(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OwnerDashboardPage;
