import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import DashboardImg from "../../assets/img/stocktrack-ill.png";

const STATS = [
  { value: "50K+", label: "Active users" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "2M+", label: "Items tracked" },
  { value: "4.9★", label: "User rating" },
];

const DevicePreview = () => {
  const navigate = useNavigate();

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "var(--color-bg-app-alt)" }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: "var(--color-brand-primary)" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* ── Left: image ── */}
          <div className="flex-1 w-full">
            <div
              className="rounded-2xl overflow-hidden screenshot-glow"
              style={{
                border: "1px solid var(--color-border-brand)",
              }}
            >
              <img
                src={DashboardImg}
                alt="StockTrack on multiple devices"
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* ── Right: copy + stats ── */}
          <div className="flex-1 max-w-lg">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-brand-primary-soft)" }}
            >
              Built for scale
            </p>

            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5"
              style={{ color: "var(--color-text-primary)" }}
            >
              StockTrack: Empowering your inventory — effortlessly.
            </h2>

            <p
              className="text-base leading-relaxed mb-10"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Manage stock across every warehouse, track every movement in
              real time, and make confident decisions with data-driven insights
              — built with best-in-class practices for businesses of every size.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl"
                  style={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-border-soft)",
                  }}
                >
                  <p
                    className="text-2xl font-extrabold mb-0.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {value}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "var(--color-brand-primary)",
                color: "white",
                boxShadow: "var(--shadow-glow)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--color-brand-primary-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--color-brand-primary)")
              }
            >
              Get Started Today <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DevicePreview;
