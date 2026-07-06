import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaPlay, FaCheckCircle } from "react-icons/fa";
import DashboardPreview from "../../assets/img/hero-dashboard.png";

const TRUST_BADGES = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden dot-grid"
      style={{
        background: "var(--color-bg-app)",
        minHeight: "100vh",
      }}
    >
      {/* ── Background radial glows ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute -left-40 top-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25"
          style={{ background: "var(--color-brand-secondary)" }}
        />
        <div
          className="absolute right-0 top-0 w-[700px] h-[700px] rounded-full blur-[140px] opacity-15"
          style={{ background: "var(--color-brand-primary)" }}
        />
        <div
          className="absolute left-1/2 bottom-0 w-[400px] h-[300px] -translate-x-1/2 rounded-full blur-[100px] opacity-10"
          style={{ background: "var(--color-brand-cyan)" }}
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-24 flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-6 w-full min-h-screen">

        {/* ── LEFT: copy — fixed width so image gets the bulk of the space ── */}
        <div className="w-full lg:w-[42%] xl:w-[40%] shrink-0 pb-10 lg:pb-24">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "var(--color-nav-active-bg)",
              border: "1px solid var(--color-border-brand)",
              color: "var(--color-brand-primary-soft)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--color-brand-primary-soft)" }}
            />
            #1 Inventory Management Software
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5"
            style={{ color: "var(--color-text-primary)" }}
          >
            Inventory
            <br />
            management
            <br />
            <span className="gradient-text">made simple.</span>
          </h1>

          {/* Sub-copy */}
          <p
            className="text-base lg:text-lg leading-relaxed mb-8"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Track stock, manage orders, and gain real-time insights across your
            entire business — all in one powerful platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
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
              Start Free Trial <FaArrowRight className="text-xs" />
            </button>

            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "transparent",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-medium)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border-strong)";
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border-medium)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-surface-4)" }}
              >
                <FaPlay className="text-[8px] ml-0.5" />
              </span>
              Book a Demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                <FaCheckCircle
                  className="text-sm shrink-0"
                  style={{ color: "var(--color-success)" }}
                />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: dashboard screenshot ── */}
        {/*
          In the reference image the screenshot:
          - Takes up the full right half (~58% width)
          - Is vertically centered in the hero, slightly overlapping the bottom
          - Has a dark rounded frame with a thin brand border
          - No perspective tilt — it's a straight-on screenshot
          - Has two small floating stat cards
        */}
        <div
          className="w-full lg:w-[58%] xl:w-[60%] relative"
          style={{
            /* Push down slightly so the image bottom bleeds past the section on desktop */
            paddingTop: "0",
          }}
        >
          {/* Ambient glow behind the frame */}
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-20 pointer-events-none -z-10"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))",
              transform: "scale(1.05)",
            }}
            aria-hidden
          />

          {/* Screenshot frame */}
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{
              border: "1px solid rgba(99,102,241,0.4)",
              background: "var(--color-surface-2)",
              boxShadow:
                "0 0 0 1px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.12)",
            }}
          >
            {/* App chrome bar */}
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 shrink-0"
              style={{
                background: "var(--color-surface-3)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "#ef4444" }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "#f59e0b" }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "#22c55e" }}
              />
              <div
                className="ml-3 h-4 rounded flex-1 max-w-[180px]"
                style={{ background: "var(--color-surface-4)" }}
              />
            </div>

            {/* Dashboard image — full width, no fixed height */}
            <img
              src={DashboardPreview}
              alt="StockTrack dashboard"
              className="w-full h-auto block"
              loading="eager"
            />
          </div>

          {/* Floating stat — items in stock (bottom-left) */}
          <div
            className="absolute -bottom-4 -left-4 px-3 py-2.5 rounded-xl hidden md:flex items-center gap-2.5 z-10"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-brand)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "var(--color-stock-in-soft)" }}
            >
              📦
            </div>
            <div>
              <p
                className="text-xs font-bold leading-none mb-0.5"
                style={{ color: "var(--color-text-primary)" }}
              >
                32,145
              </p>
              <p
                className="text-[10px] leading-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                Items in stock
              </p>
            </div>
          </div>

          {/* Floating stat — pending orders (top-right) */}
          <div
            className="absolute -top-4 -right-4 px-3 py-2.5 rounded-xl hidden lg:flex items-center gap-2.5 z-10"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-brand)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "var(--color-warning-soft)" }}
            >
              🔔
            </div>
            <div>
              <p
                className="text-xs font-bold leading-none mb-0.5"
                style={{ color: "var(--color-text-primary)" }}
              >
                56
              </p>
              <p
                className="text-[10px] leading-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                Pending orders
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
