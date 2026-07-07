import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MdAttachMoney, MdInventory2, MdRemoveShoppingCart, MdShoppingCart, MdAdd } from "react-icons/md";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import AddProductView from "../components/dashboard/AddProductView";
import StockStateEditor from "../components/dashboard/StockStateEditor";
import {
  StatCard,
  InventoryTurnoverChart,
  CategoryDonutChart,
  LowStockPanel,
  RecentActivityPanel,
  ProductsTable,
} from "../components/dashboard/DashboardWidgets";
import { RootState } from "../app/store";
import { Product } from "../types";

type DashView = "dashboard" | "add-product";

/* ── Synthetic sparkline data (realistic-looking 8-point curves) ── */
const SPARKS = {
  value:   [320,380,410,370,450,420,490,510],
  stock:   [300,310,290,320,340,360,330,350],
  out:     [12,8,14,10,18,12,20,15],
  orders:  [5,8,6,10,7,9,8,6],
};

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView]                         = useState<DashView>("dashboard");
  const [editItemId, setEditItemId]             = useState<string | null>(null);

  const products = useSelector((s: RootState) => s.stock.productData);

  useEffect(() => { document.title = "StockTrack — Dashboard"; }, []);

  /* ── Derived metrics ── */
  const totalValue  = products.reduce((a: number, p: Product) => a + p.product_Qty * p.product_Price, 0);
  const totalStock  = products.reduce((a: number, p: Product) => a + p.product_Qty, 0);
  const outOfStock  = products.filter((p: Product) => p.product_Qty === 0).length;
  const lowStock    = products.filter((p: Product) => p.product_Qty > 0 && p.product_Qty <= 10).length;

  const editItem = products.find((p: Product) => p.id === editItemId);

  /* sidebar width for main content offset */
  const sideW = sidebarCollapsed ? 64 : 220;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-app)" }}
    >
      {/* ── Sidebar ── */}
      <DashboardSidebar
        onNewItem={() => setView("add-product")}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        activeView={view}
      />

      {/* ── Top header ── */}
      <DashboardHeader onMenuClick={() => setSidebarCollapsed((p) => !p)} />

      {/* ── Main content area ── */}
      <main
        className="transition-all duration-300 pt-14 min-h-screen"
        style={{ marginLeft: `${sideW}px` }}
      >
        {/* ── ADD PRODUCT VIEW ── */}
        {view === "add-product" ? (
          <AddProductView
            onCancel={() => setView("dashboard")}
            onSaved={() => setView("dashboard")}
          />
        ) : (
          /* ── DASHBOARD VIEW ── */
          <div className="p-5 flex flex-col gap-5">

          {/* ── Stat cards row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Inventory Value"
              value={products.length > 0 ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$4,289,109.00"}
              change={5.2}
              sparkData={SPARKS.value}
              sparkColor="var(--color-chart-indigo)"
              iconBg="var(--color-nav-active-bg)"
              icon={<MdAttachMoney size={18} style={{ color: "var(--color-brand-primary-soft)" }} />}
            />
            <StatCard
              title="Stock on Hand"
              value={products.length > 0 ? totalStock.toLocaleString() : "32,145"}
              change={3.7}
              sparkData={SPARKS.stock}
              sparkColor="var(--color-chart-green)"
              iconBg="var(--color-stock-in-soft)"
              icon={<MdInventory2 size={18} style={{ color: "var(--color-stock-in)" }} />}
            />
            <StatCard
              title="Items Out of Stock"
              value={products.length > 0 ? String(outOfStock) : "128"}
              change={-12.4}
              sparkData={SPARKS.out}
              sparkColor="var(--color-chart-red)"
              iconBg="var(--color-stock-out-soft)"
              icon={<MdRemoveShoppingCart size={18} style={{ color: "var(--color-stock-out)" }} />}
            />
            <StatCard
              title="Pending Orders"
              value={products.length > 0 ? String(lowStock) : "56"}
              change={-8.1}
              sparkData={SPARKS.orders}
              sparkColor="var(--color-chart-purple)"
              iconBg="var(--color-order-pending-soft)"
              icon={<MdShoppingCart size={18} style={{ color: "var(--color-order-pending)" }} />}
            />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <InventoryTurnoverChart />
            </div>
            <div>
              <CategoryDonutChart />
            </div>
          </div>

          {/* ── Bottom row: Low Stock + Recent Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LowStockPanel />
            <RecentActivityPanel />
          </div>

          {/* ── Products overview table (full width) ── */}
          <ProductsTable
            onEdit={(id) => setEditItemId(id)}
            onAdd={() => setView("add-product")}
          />

        </div>
        )} {/* end dashboard view */}
      </main>

      {/* ── Add Product FAB — only shown on dashboard view ── */}
      {view === "dashboard" && (
        <button
          onClick={() => setView("add-product")}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold shadow-lg transition-all"
          style={{
            background: "var(--color-brand-primary)",
            color: "white",
            boxShadow: "var(--shadow-glow)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--color-brand-primary-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--color-brand-primary)")
          }
        >
          <MdAdd size={20} />
          Add Product
        </button>
      )}

      {/* ── Edit stock editor ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <StockStateEditor
            id={editItem.id}
            qty={editItem.product_Qty}
            price={editItem.product_Price}
            des={editItem.product_description}
            siz={editItem.size}
            stockState={0}
            index={0}
            onClose={() => setEditItemId(null)}
            onDelete={async (e, id) => {
              const { deleteDoc, doc } = await import("firebase/firestore");
              const { default: db } = await import("../services/firebase");
              await deleteDoc(doc(db, "stock", id));
              setEditItemId(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
