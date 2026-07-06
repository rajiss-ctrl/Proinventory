import {
  FaBoxes,
  FaBell,
  FaChartBar,
  FaWarehouse,
  FaShieldAlt,
} from "react-icons/fa";
import { MdBarChart } from "react-icons/md";

/* ── Trusted logos (text-based like the screenshot) ── */
const LOGOS = [
  { icon: "◎", name: "TechNova" },
  { icon: "🛒", name: "FreshMart" },
  { icon: "U", name: "Urban Wear" },
  { icon: "⊞", name: "Home Essentials" },
  { icon: "◑", name: "GreenBasket" },
  { icon: "✦", name: "FitLife" },
];

/* ── Feature cards ── */
const FEATURES = [
  {
    icon: <FaBoxes size={22} />,
    title: "Real-time Tracking",
    description:
      "Monitor stock levels across all locations in real time and never run out or overstock again.",
  },
  {
    icon: <FaBell size={22} />,
    title: "Smart Alerts",
    description:
      "Get notified about low stock, expiring items, and pending orders before it's too late.",
  },
  {
    icon: <FaChartBar size={22} />,
    title: "Detailed Analytics",
    description:
      "Visualize key metrics and trends with beautiful reports and interactive dashboards.",
  },
  {
    icon: <FaWarehouse size={22} />,
    title: "Multi-location Support",
    description:
      "Manage inventory across multiple warehouses and locations with ease.",
  },
  {
    icon: <FaShieldAlt size={22} />,
    title: "Secure & Scalable",
    description:
      "Enterprise-grade security with 99.9% uptime. Built to grow with your business.",
  },
  {
    icon: <MdBarChart size={22} />,
    title: "Order Management",
    description:
      "Streamline purchase orders, track deliveries, and manage suppliers all in one place.",
  },
];

const FeatureShowcase = () => (
  <>
    {/* ── Trusted by logos strip ── */}
    <section
      className="py-12"
      style={{
        background: "var(--color-bg-app-alt)",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p
          className="text-center text-xs font-medium uppercase tracking-widest mb-8"
          style={{ color: "var(--color-text-faint)" }}
        >
          Trusted by leading businesses
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {LOGOS.map(({ icon, name }) => (
            <div
              key={name}
              className="flex items-center gap-2 transition-opacity"
              style={{ color: "var(--color-text-muted)", opacity: 0.7 }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "1")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "0.7")
              }
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features grid ── */}
    <section
      id="features"
      className="py-24"
      style={{ background: "var(--color-bg-app)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-brand-primary-soft)" }}
          >
            Powerful Features
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            Everything you need to manage inventory like a pro
          </h2>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Streamline operations, reduce costs, and make smarter decisions with
            real-time data.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-xl transition-all group cursor-default"
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border-soft)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border-brand)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border-soft)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-surface-1)";
              }}
            >
              {/* Icon box */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{
                  background: "var(--color-nav-active-bg)",
                  color: "var(--color-brand-primary-soft)",
                  border: "1px solid var(--color-border-brand)",
                }}
              >
                {icon}
              </div>

              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default FeatureShowcase;
