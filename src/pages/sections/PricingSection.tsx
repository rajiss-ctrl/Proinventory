import { useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa";

interface Plan {
  name: string;
  tagline: string;
  price: number;
  period: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "Perfect for small businesses",
    price: 29,
    period: "month",
    highlighted: false,
    cta: "Start Free Trial",
    features: [
      "Up to 1,000 products",
      "1 user included",
      "2 warehouses",
      "Basic reports",
      "Email support",
    ],
  },
  {
    name: "Professional",
    tagline: "Ideal for growing businesses",
    price: 79,
    period: "month",
    highlighted: true,
    badge: "Most Popular",
    cta: "Start Free Trial",
    features: [
      "Up to 10,000 products",
      "5 users included",
      "10 warehouses",
      "Advanced reports",
      "Priority support",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    tagline: "Built for large organizations",
    price: 199,
    period: "month",
    highlighted: false,
    cta: "Contact Sales",
    features: [
      "Unlimited products",
      "Unlimited users",
      "Unlimited warehouses",
      "Custom reports",
      "Dedicated support",
      "SLA & Onboarding",
    ],
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="pricing"
      className="py-24"
      style={{ background: "var(--color-bg-app)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-brand-primary-soft)" }}
          >
            Simple, Transparent Pricing
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            Choose the perfect plan for your business
          </h2>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Start free and upgrade anytime. No hidden fees.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl p-8 transition-all"
              style={{
                background: plan.highlighted
                  ? "linear-gradient(160deg, #1e1b4b 0%, #1a2238 100%)"
                  : "var(--color-surface-1)",
                border: plan.highlighted
                  ? "1px solid var(--color-border-brand-strong)"
                  : "1px solid var(--color-border-soft)",
                boxShadow: plan.highlighted ? "var(--shadow-glow)" : "none",
              }}
            >
              {/* Most popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-4 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "var(--color-brand-primary)",
                      color: "white",
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <p
                  className="text-sm font-semibold mb-1"
                  style={{
                    color: plan.highlighted
                      ? "var(--color-brand-primary-soft)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {plan.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {plan.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <span
                  className="text-5xl font-extrabold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  ${plan.price}
                </span>
                <span
                  className="text-sm ml-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  /{plan.period}
                </span>
              </div>

              {/* Divider */}
              <div
                className="mb-6 h-px"
                style={{ background: "var(--color-border-soft)" }}
              />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <FaCheck
                      className="shrink-0 text-xs"
                      style={{ color: "var(--color-success)" }}
                    />
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => navigate(plan.highlighted ? "/register" : plan.cta === "Contact Sales" ? "/" : "/register")}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
                style={
                  plan.highlighted
                    ? {
                        background: "var(--color-brand-primary)",
                        color: "white",
                      }
                    : {
                        background: "transparent",
                        color: "var(--color-text-primary)",
                        border: "1px solid var(--color-border-medium)",
                      }
                }
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (plan.highlighted) {
                    el.style.background = "var(--color-brand-primary-hover)";
                  } else {
                    el.style.background = "rgba(255,255,255,0.04)";
                    el.style.borderColor = "var(--color-border-strong)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (plan.highlighted) {
                    el.style.background = "var(--color-brand-primary)";
                  } else {
                    el.style.background = "transparent";
                    el.style.borderColor = "var(--color-border-medium)";
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
