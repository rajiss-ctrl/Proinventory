import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  MdAttachMoney, MdInventory2,
  MdRemoveShoppingCart, MdShoppingCart, MdAdd,
} from "react-icons/md";
import DashboardSidebar  from "../components/dashboard/DashboardSidebar";
import DashboardHeader   from "../components/dashboard/DashboardHeader";
import AddProductView    from "../components/dashboard/AddProductView";
import StockStateEditor  from "../components/dashboard/StockStateEditor";
import {
  StatCard, InventoryTurnoverChart,
  CategoryDonutChart, LowStockPanel,
  RecentActivityPanel, ProductsTable,
} from "../components/dashboard/DashboardWidgets";
import { RootState } from "../app/store";
import { Product }   from "../types";
import useRole       from "../hooks/useRole";
import LoadingSpinner from "../components/ui/LoadingSpinner";

type DashView = "dashboard" | "add-product";

const SPARKS = {
  value:   [320,380,410,370,450,420,490,510],
  stock:   [300,310,290,320,340,360,330,350],
  out:     [12,8,14,10,18,12,20,15],
  orders:  [5,8,6,10,7,9,8,6],
};

const DashboardPage = () => {
  const {
    isSuperAdmin, isOwner, isOwnerOrAdmin,
    canAddProduct, canEditProduct, canDeleteProduct,
    role,
  } = useRole();
  const authStatus = useSelector((s: RootState) => s.auth.status);

  // Redirect immediately via render (not useEffect) to avoid flash
  if (isSuperAdmin) return <Navigate to="/superadmin" replace />;
  if (isOwner)      return <Navigate to="/owner"      replace />;

  // Still loading profile — don't render staff view yet
  if (!role || role === "staff" && authStatus === "loading") return <LoadingSpinner />;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView]       = useState<DashView>("dashboard");
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const products = useSelector((s: RootState) => s.stock.productData);
  const companyId = useSelector((s: RootState) => s.auth.user?.companyId) ?? "";

  const totalValue  = products.reduce((a: number, p: Product) => a + (p.stockQuantity ?? 0) * (p.price ?? 0), 0);
  const totalStock  = products.reduce((a: number, p: Product) => a + (p.stockQuantity ?? 0), 0);
  const outOfStock  = products.filter((p: Product) => (p.stockQuantity ?? 0) === 0).length;
  const lowStock    = products.filter((p: Product) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 10).length;

  const editItem = products.find((p: Product) => p.id === editItemId);
  const sideW    = sidebarCollapsed ? 64 : 220;

  useEffect(() => { document.title = "StockTrack — Dashboard"; }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-app)" }}>
      <DashboardSidebar
        onNewItem={() => setView("add-product")}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        activeView={view}
      />
      <DashboardHeader onMenuClick={() => setSidebarCollapsed((p) => !p)} />

      <main className="transition-all duration-300 pt-14 min-h-screen" style={{ marginLeft: `${sideW}px` }}>

        {/* ── Staff role banner ── */}
        {!isOwnerOrAdmin && !isSuperAdmin && (
          <div
            className="mx-5 mt-4 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
            style={{
              background: "var(--color-info-soft)",
              border: "1px solid var(--color-info-border)",
              color: "var(--color-info)",
            }}
          >
            ℹ️ You have <strong>Staff</strong> access — you can view and add products.
            Editing and deleting are restricted to the business owner.
          </div>
        )}

        {view === "add-product" && canAddProduct ? (
          <AddProductView
            onCancel={() => setView("dashboard")}
            onSaved={() => setView("dashboard")}
          />
        ) : (
          <div className="p-5 flex flex-col gap-5">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Inventory Value"
                value={products.length > 0 ? `$${totalValue.toLocaleString("en-US",{minimumFractionDigits:2})}` : "$4,289,109.00"}
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

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><InventoryTurnoverChart /></div>
              <CategoryDonutChart />
            </div>

            {/* ── Bottom panels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LowStockPanel />
              <RecentActivityPanel />
            </div>

            {/* ── Products table — pass role flags so it hides edit/delete for staff ── */}
            <ProductsTable
              onEdit={canEditProduct ? (id) => setEditItemId(id) : undefined}
              onAdd={canAddProduct   ? () => setView("add-product") : undefined}
              readOnly={!canEditProduct}
            />
          </div>
        )}
      </main>

      {/* Add Product FAB — only if role allows */}
      {view === "dashboard" && canAddProduct && (
        <button
          onClick={() => setView("add-product")}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold"
          style={{ background: "var(--color-brand-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}
        >
          <MdAdd size={20} /> Add Product
        </button>
      )}

      {/* Edit modal */}
      {editItem && canEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <StockStateEditor
            id={editItem.id}
            qty={editItem.stockQuantity ?? editItem.product_Qty ?? 0}
            price={editItem.price ?? editItem.product_Price ?? 0}
            des={editItem.product_description}
            siz={editItem.size ?? "Piece"}
            stockState={0} index={0}
            onClose={() => setEditItemId(null)}
            onDelete={canDeleteProduct ? async (e, id) => {
              const { deleteDoc, doc } = await import("firebase/firestore");
              const { default: db } = await import("../services/firebase");
              await deleteDoc(doc(db, "companies", companyId, "products", id));
              setEditItemId(null);
            } : async () => { setEditItemId(null); }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
