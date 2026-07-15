import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { MdTrendingUp, MdTrendingDown, MdInfoOutline } from "react-icons/md";
import { FiEdit2, FiMoreHorizontal } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { Product } from "../../types";
import Spinner from "../../assets/img/spinner.svg";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Tooltip, Legend, Filler
);

/* ─────────────────────────────────────────────────────────────
   MINI SPARKLINE (used inside stat cards)
───────────────────────────────────────────────────────────── */
interface SparklineProps {
  data: number[];
  color: string;
  fill?: boolean;
}
const Sparkline = ({ data, color, fill = true }: SparklineProps) => (
  <Line
    data={{
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: fill ? `${color}22` : "transparent",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill,
      }],
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: false,
    }}
    style={{ height: "48px" }}
  />
);

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
interface StatCardProps {
  title: string;
  value: string;
  change: number;
  sparkData: number[];
  sparkColor: string;
  iconBg: string;
  icon: React.ReactNode;
}
export const StatCard = ({ title, value, change, sparkData, sparkColor, iconBg, icon }: StatCardProps) => {
  const positive = change >= 0;
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-soft)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>
            {title}
          </p>
          <p className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {positive
          ? <MdTrendingUp style={{ color: "var(--color-success)" }} />
          : <MdTrendingDown style={{ color: "var(--color-danger)" }} />}
        <span style={{ color: positive ? "var(--color-success)" : "var(--color-danger)" }}>
          {positive ? "+" : ""}{change}%
        </span>
        <span style={{ color: "var(--color-text-faint)" }}> vs last 30 days</span>
      </div>
      <div className="h-12 w-full mt-1">
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   INVENTORY TURNOVER BAR CHART
───────────────────────────────────────────────────────────── */
interface InventoryTurnoverChartProps {
  productsOverride?: Product[];
}

export const InventoryTurnoverChart = ({ productsOverride }: InventoryTurnoverChartProps) => {
  const reduxProducts = useSelector((s: RootState) => s.stock.productData);
  const products = productsOverride ?? reduxProducts;

  const labels = ["Apr 24","Apr 29","May 4","May 9","May 14","May 19","May 24"];
  const soldData    = [8000,12000,15000,10000,18000,14000,20000];
  const returnData  = [2000,3000,2500,1500,4000,3500,2000];
  const adjustData  = [1000,1500,3000,2000,2500,1000,3500];

  // overlay real product data if available
  if (products.length > 0) {
    products.slice(0, 7).forEach((p: Product, i: number) => {
      soldData[i] = Math.min(p.product_Qty * 10, 20000);
    });
  }

  const data = {
    labels,
    datasets: [
      { label: "Sold", data: soldData, backgroundColor: "rgba(99,102,241,0.85)", borderRadius: 3, stack: "a" },
      { label: "Returned", data: returnData, backgroundColor: "rgba(34,197,94,0.75)", borderRadius: 3, stack: "a" },
      { label: "Adjustment", data: adjustData, backgroundColor: "rgba(245,158,11,0.75)", borderRadius: 3, stack: "a" },
    ],
  };

  const options: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "start" as const,
        labels: { color: "#94a3b8", boxWidth: 10, font: { size: 11 }, padding: 12 },
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#64748b", font: { size: 11 },
          callback: (v: number) => v >= 1000 ? `${v / 1000}K` : v,
        },
      },
    },
  };

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Inventory Turnover <span style={{ color: "var(--color-text-faint)" }}>(Last 30 Days)</span>
          </p>
        </div>
        <button
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)" }}
        >
          Last 30 Days ▾
        </button>
      </div>
      <div style={{ height: "200px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STOCK DISTRIBUTION DONUT CHART
───────────────────────────────────────────────────────────── */
interface CategoryDonutChartProps {
  productsOverride?: Product[];
}

export const CategoryDonutChart = ({ productsOverride }: CategoryDonutChartProps) => {
  const reduxProducts = useSelector((s: RootState) => s.stock.productData);
  const products = productsOverride ?? reduxProducts;

  const categoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p: Product) => {
      const cat = p.product_description ?? "Others";
      map[cat] = (map[cat] ?? 0) + p.product_Qty;
    });
    return map;
  }, [products]);

  const hasReal = Object.keys(categoryMap).length > 0;
  const labels  = hasReal ? Object.keys(categoryMap) : ["Electronics","Apparel","Groceries","Home & Kitchen","Others"];
  const values  = hasReal ? Object.values(categoryMap) : [38.6, 24.5, 18.7, 9.8, 8.4];
  const total   = values.reduce((a, b) => a + b, 0);

  const COLORS = ["#6366f1","#22c55e","#f59e0b","#38bdf8","#94a3b8"];
  const PCT    = values.map((v) => ((v / total) * 100).toFixed(1));

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: COLORS,
      borderColor: "transparent",
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const options: any = {
    responsive: true, maintainAspectRatio: false, cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${PCT[ctx.dataIndex]}%`,
        },
      },
    },
  };

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Stock Distribution by Category
        </p>
        <MdInfoOutline size={14} style={{ color: "var(--color-text-faint)" }} />
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-lg font-extrabold leading-none" style={{ color: "var(--color-text-primary)" }}>
              {total.toLocaleString()}
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>Total items</p>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex-1 space-y-2">
          {labels.map((label, i) => (
            <li key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {PCT[i]}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button className="mt-3 text-xs self-start" style={{ color: "var(--color-brand-primary-soft)" }}>
        View full report →
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   LOW STOCK ALERT PANEL
───────────────────────────────────────────────────────────── */
interface LowStockPanelProps {
  productsOverride?: Product[];
}

export const LowStockPanel = ({ productsOverride }: LowStockPanelProps) => {
  const reduxProducts = useSelector((s: RootState) => s.stock.productData);
  const products = productsOverride ?? reduxProducts;

  const LOW = 10;
  const lowItems = products
    .filter((p: Product) => p.product_Qty <= LOW)
    .slice(0, 5);

  const fallback = [
    { id: "f1", product_name: "Wireless Headphones", sku: "SKU-1024", product_Qty: 3 },
    { id: "f2", product_name: "Smart Watch Series 5", sku: "SKU-1031", product_Qty: 2 },
    { id: "f3", product_name: "Organic Quinoa 1kg",  sku: "SKU-2047", product_Qty: 1 },
    { id: "f4", product_name: "Ergonomic Office Chair", sku: "SKU-3055", product_Qty: 0 },
  ];

  const items = lowItems.length > 0 ? lowItems : fallback;

  const stockColor = (qty: number) =>
    qty === 0 ? "var(--color-danger)" : qty <= 3 ? "var(--color-warning)" : "var(--color-success)";

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Low Stock Alert
        </p>
        <button className="text-xs" style={{ color: "var(--color-brand-primary-soft)" }}>View All</button>
      </div>

      <ul className="space-y-3">
        {items.map((item: any, i: number) => (
          <li key={item.id ?? i} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg"
              style={{ background: "var(--color-surface-3)" }}
            >
              {item.img
                ? <img src={item.img} alt="" className="w-full h-full rounded-lg object-cover" />
                : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                {item.product_name}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                {item.sku ?? `SKU-${item.id?.slice(0, 6).toUpperCase()}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>Stock</p>
              <p className="text-sm font-extrabold" style={{ color: stockColor(item.product_Qty) }}>
                {item.product_Qty}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   RECENT ACTIVITY PANEL
───────────────────────────────────────────────────────────── */
interface ActivityItem {
  icon: string;
  iconBg: string;
  text: React.ReactNode;
  time: string;
}

interface RecentActivityPanelProps {
  productsOverride?: Product[];
}

export const RecentActivityPanel = ({ productsOverride }: RecentActivityPanelProps) => {
  const reduxProducts = useSelector((s: RootState) => s.stock.productData);
  const products = productsOverride ?? reduxProducts;

  const activities: ActivityItem[] = useMemo(() => {
    const base: ActivityItem[] = [
      {
        icon: "📦",
        iconBg: "var(--color-stock-in-soft)",
        text: <><strong>John Anderson</strong> updated quantity for <strong>Wireless Headphones (SKU-1024)</strong></>,
        time: "2m ago",
      },
      {
        icon: "🛒",
        iconBg: "var(--color-info-soft)",
        text: <>New order <strong>#ORD-1048</strong> has been created</>,
        time: "15m ago",
      },
      {
        icon: "✏️",
        iconBg: "var(--color-warning-soft)",
        text: <><strong>Sarah Johnson</strong> updated price for <strong>Organic Quinoa 1kg (SKU-2047)</strong></>,
        time: "32m ago",
      },
      {
        icon: "🏭",
        iconBg: "var(--color-stock-low-soft)",
        text: <>Stock transfer received at <strong>Warehouse B</strong></>,
        time: "1h ago",
      },
    ];
    if (products.length > 0) {
      base[0] = {
        icon: "📦",
        iconBg: "var(--color-stock-in-soft)",
        text: <>Stock updated for <strong>{products[0].product_name}</strong></>,
        time: "Just now",
      };
    }
    return base;
  }, [products]);

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Recent Activity
        </p>
        <button className="text-xs" style={{ color: "var(--color-brand-primary-soft)" }}>View All</button>
      </div>

      <ul className="space-y-4">
        {activities.map((a, i) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
              style={{ background: a.iconBg }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                {a.text}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                {a.time}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   PRODUCTS OVERVIEW TABLE
───────────────────────────────────────────────────────────── */
interface ProductsTableProps {
  onEdit?: (id: string) => void;
  onAdd?:  () => void;
  readOnly?: boolean;
  productsOverride?: Product[];
}

export const ProductsTable = ({ onEdit, onAdd, readOnly = false, productsOverride }: ProductsTableProps) => {
  const reduxProducts = useSelector((s: RootState) => s.stock.productData);
  const products = productsOverride ?? reduxProducts;

  const FALLBACK = [
    { id: "f1", product_name: "Wireless Headphones", sku: "SKU-1024", category: "Electronics",  product_Price: 129.99, product_Qty: 3,   size: "Piece" },
    { id: "f2", product_name: "Smart Watch Series 5", sku: "SKU-1031", category: "Electronics",  product_Price: 249.99, product_Qty: 2,   size: "Piece" },
    { id: "f3", product_name: "Organic Quinoa 1kg",   sku: "SKU-2047", category: "Groceries",    product_Price: 6.49,   product_Qty: 1,   size: "Bag"   },
    { id: "f4", product_name: "Ergonomic Office Chair",sku: "SKU-3055", category: "Home & Kitchen",product_Price: 349.00, product_Qty: 0,  size: "Piece" },
    { id: "f5", product_name: "Yoga Mat Eco",          sku: "SKU-4021", category: "Sports & Outdoors",product_Price: 29.99, product_Qty: 120, size: "Piece" },
    { id: "f6", product_name: "Cotton T-Shirt (M)",    sku: "SKU-5012", category: "Apparel",      product_Price: 14.99,  product_Qty: 250, size: "Piece" },
  ];

  const rows = products.length > 0
    ? products.map((p: Product, i: number) => ({
        ...p,
        sku: `SKU-${p.id.slice(0, 4).toUpperCase()}`,
        category: p.categoryName || p.product_description || "General",
      }))
    : FALLBACK;

  const statusInfo = (qty: number) => {
    if (qty === 0)  return { label: "Out of Stock", bg: "var(--color-stock-out-soft)",   text: "var(--color-stock-out)",   border: "var(--color-stock-out-border)" };
    if (qty <= 5)   return { label: "Low Stock",    bg: "var(--color-stock-low-soft)",   text: "var(--color-stock-low)",   border: "var(--color-stock-low-border)" };
    return           { label: "In Stock",           bg: "var(--color-stock-in-soft)",    text: "var(--color-stock-in)",    border: "var(--color-stock-in-border)" };
  };

  const PAGE_SIZE = 6;
  const visible = rows.slice(0, PAGE_SIZE);

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}
    >
      {/* Table header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
          Products Overview
        </h3>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs"
            style={{
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              color: "var(--color-input-placeholder)",
            }}
          >
            🔍 Search products...
          </div>
          {/* Filters */}
          <button
            className="h-8 px-3 rounded-lg text-xs flex items-center gap-1"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border-soft)",
            }}
          >
            ⚙ Filters
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <FiMoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              {["", "SKU", "Product Name", "Category", "Price", "Stock Quantity", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((item: any) => {
              const status = statusInfo(item.product_Qty);
              return (
                <tr
                  key={item.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="accent-indigo-500 w-3.5 h-3.5" />
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>{item.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-sm"
                        style={{ background: "var(--color-surface-3)" }}
                      >
                        {item.img ? <img src={item.img} className="w-full h-full rounded-md object-cover" alt="" /> : "📦"}
                      </div>
                      <span className="font-medium truncate max-w-[120px]" style={{ color: "var(--color-text-primary)" }}>
                        {item.product_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{item.category}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    ${Number(item.product_Price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {item.product_Qty}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-semibold"
                      style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>View only</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            <FiEdit2 size={12} />
                          </button>
                        )}
                        <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "var(--color-text-muted)" }}>
                          <FiMoreHorizontal size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-4 py-3 text-xs"
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>Showing 1 to {Math.min(PAGE_SIZE, rows.length)} of {rows.length} products</span>
        <div className="flex items-center gap-1">
          {["‹", "1", "2", "3", "4", "5", "...", "9", "›"].map((p, i) => (
            <button
              key={i}
              className="w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors"
              style={
                p === "1"
                  ? { background: "var(--color-brand-primary)", color: "white" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
