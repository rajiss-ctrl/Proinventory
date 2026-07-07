import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdHome, MdArrowBack, MdDashboard, MdInventory2,
  MdShoppingCart, MdBarChart, MdArrowForward,
} from "react-icons/md";
import Navbar from "../components/layout/Navbar";
import Bg404 from "../assets/img/404-bg.png";
import Bubble404 from "../assets/img/404-bubble.png";

/* ── Helpful links ── */
const LINKS = [
  {
    icon: <MdDashboard size={20} />,
    iconBg: "var(--color-nav-active-bg)",
    iconColor: "var(--color-brand-primary-soft)",
    arrowColor: "var(--color-brand-primary-soft)",
    title: "Dashboard",
    desc: "Go to your dashboard and continue managing your inventory.",
    to: "/dashboard",
  },
  {
    icon: <MdInventory2 size={20} />,
    iconBg: "var(--color-stock-in-soft)",
    iconColor: "var(--color-stock-in)",
    arrowColor: "var(--color-stock-in)",
    title: "Products",
    desc: "Browse and manage your products.",
    to: "/dashboard",
  },
  {
    icon: <MdShoppingCart size={20} />,
    iconBg: "var(--color-info-soft)",
    iconColor: "var(--color-info)",
    arrowColor: "var(--color-info)",
    title: "Orders",
    desc: "View and track your orders.",
    to: "/dashboard",
  },
  {
    icon: <MdBarChart size={20} />,
    iconBg: "var(--color-warning-soft)",
    iconColor: "var(--color-warning)",
    arrowColor: "var(--color-warning)",
    title: "Analytics",
    desc: "Check reports and gain powerful insights.",
    to: "/dashboard",
  },
];

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "ProInventory — Page Not Found";
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--color-bg-app)" }}
    >
      {/* ── Full-bleed background illustration ── */}
      <img
        src={Bg404}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0.55, zIndex: 0 }}
      />

      {/* ── Navbar ── */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* ── Hero section ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-0">

        {/* 404 large text + bubble in the centre */}
        <div className="relative flex items-center justify-center select-none mb-6">
          {/* "4" left */}
          <span
            className="font-extrabold leading-none"
            style={{
              fontSize: "clamp(100px, 18vw, 200px)",
              color: "transparent",
              WebkitTextStroke: "2px rgba(99,102,241,0.5)",
              background: "linear-gradient(180deg, #6366f1 0%, #4338ca 60%, #1e1b4b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(99,102,241,0.6))",
            }}
          >
            4
          </span>

          {/* Bubble / orb in the zero position */}
          <div
            className="relative mx-2 sm:mx-4"
            style={{
              width: "clamp(90px, 14vw, 160px)",
              height: "clamp(90px, 14vw, 160px)",
            }}
          >
            <img
              src={Bubble404}
              alt="404 orb"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 30px rgba(79,70,229,0.8)) drop-shadow(0 0 60px rgba(99,102,241,0.4))",
              }}
            />
          </div>

          {/* "4" right */}
          <span
            className="font-extrabold leading-none"
            style={{
              fontSize: "clamp(100px, 18vw, 200px)",
              background: "linear-gradient(180deg, #6366f1 0%, #4338ca 60%, #1e1b4b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(99,102,241,0.6))",
            }}
          >
            4
          </span>
        </div>

        {/* Heading + subtext */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-center"
          style={{ color: "var(--color-text-primary)" }}
        >
          Oops! Page not found.
        </h1>
        <p
          className="text-sm sm:text-base text-center max-w-sm mb-8 leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          The page you're looking for doesn't exist or has been moved.
          <br />
          Let's get you back on track.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all"
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
            <MdHome size={18} />
            Go to Dashboard
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "transparent",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-medium)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--color-border-brand)";
              (e.currentTarget as HTMLElement).style.background =
                "var(--color-nav-active-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--color-border-medium)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <MdArrowBack size={18} />
            Go Back
          </button>
        </div>

        {/* ── Helpful links section ── */}
        <div
          className="w-full max-w-5xl rounded-2xl p-8"
          style={{
            background: "rgba(13,18,32,0.75)",
            border: "1px solid var(--color-border-soft)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <h2
            className="text-center text-lg font-bold mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            Here are some helpful links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LINKS.map(({ icon, iconBg, iconColor, arrowColor, title, desc, to }) => (
              <Link
                key={title}
                to={to}
                className="flex flex-col p-4 rounded-xl transition-all group"
                style={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border-subtle)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--color-border-brand)";
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--color-border-subtle)";
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--color-surface-1)";
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: iconBg }}
                >
                  <span style={{ color: iconColor }}>{icon}</span>
                </div>

                {/* Title */}
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {title}
                </p>

                {/* Desc */}
                <p
                  className="text-xs leading-snug flex-1 mb-4"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {desc}
                </p>

                {/* Arrow */}
                <span style={{ color: arrowColor }}>
                  <MdArrowForward size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Support link */}
        <p
          className="mt-8 mb-6 text-sm text-center"
          style={{ color: "var(--color-text-faint)" }}
        >
          Still need help?{" "}
          <a
            href="mailto:support@proinventory.com"
            className="font-semibold transition-colors"
            style={{ color: "var(--color-brand-primary-soft)" }}
          >
            Contact our support team
          </a>
        </p>
      </main>
    </div>
  );
};

export default NotFoundPage;
