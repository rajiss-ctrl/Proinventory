import { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does the 14-day free trial work?",
    a: "Sign up with no credit card required. You get full access to all Professional features for 14 days. After the trial, choose a plan to continue — or your account simply pauses.",
  },
  {
    q: "Can I import my existing inventory?",
    a: "Yes. You can import products via CSV, Excel, or connect directly through our API. Our onboarding wizard walks you through every step.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Absolutely. Upgrade or downgrade at any time from your account settings. Billing is prorated to the day.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes — StockTrack is available on iOS and Android. Every feature accessible on desktop is also available in the mobile app.",
  },
  {
    q: "Is my data secure?",
    a: "We use AES-256 encryption at rest and TLS 1.3 in transit. All data is backed up daily to multiple geographic regions.",
  },
  {
    q: "Do you offer API access?",
    a: "API access is available on the Professional and Enterprise plans. Full REST API with webhooks, rate-limit documentation, and sandbox environment included.",
  },
  {
    q: "Do you offer customer support?",
    a: "All plans include email support. Professional plan adds priority response times. Enterprise plan includes a dedicated account manager and 24/7 phone support.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual Enterprise plans.",
  },
];

const FaqItem = ({ item }: { item: FaqItem }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: "var(--color-surface-1)",
        border: `1px solid ${open ? "var(--color-border-brand)" : "var(--color-border-soft)"}`,
      }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {item.q}
        </span>
        <span
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: open
              ? "var(--color-nav-active-bg)"
              : "var(--color-surface-3)",
            color: open
              ? "var(--color-brand-primary-soft)"
              : "var(--color-text-muted)",
            border: `1px solid ${open ? "var(--color-border-brand)" : "var(--color-border-soft)"}`,
          }}
        >
          {open ? <FaMinus className="text-[9px]" /> : <FaPlus className="text-[9px]" />}
        </span>
      </button>

      {open && (
        <div
          className="px-5 pb-5 text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {item.a}
        </div>
      )}
    </div>
  );
};

const FaqSection = () => (
  <section
    id="faq"
    className="py-24"
    style={{
      background: "var(--color-bg-app-alt)",
      borderTop: "1px solid var(--color-border-subtle)",
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-brand-primary-soft)" }}
        >
          Frequently Asked Questions
        </p>
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Got questions? We've got answers.
        </h2>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column — odd items */}
        <div className="flex flex-col gap-4">
          {FAQS.filter((_, i) => i % 2 === 0).map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>
        {/* Right column — even items */}
        <div className="flex flex-col gap-4">
          {FAQS.filter((_, i) => i % 2 !== 0).map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FaqSection;
