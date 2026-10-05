import type { BillingDangerBannerViewModel } from "./types";

export const paymentBanner: Extract<BillingDangerBannerViewModel, { kind: "payment_default" }> = {
  kind: "payment_default",
  mode: "payment_grace",
  title: "Payment issue requires attention",
  deadline: "2026-06-15T00:00:00Z",
  shouldContactAdmin: false,
  cta: { label: "Review billing", to: "/billing" },
};

export const limitBanner: Extract<BillingDangerBannerViewModel, { kind: "over_limit" }> = {
  kind: "over_limit",
  mode: "over_limit",
  title: "This company is over its plan limits",
  blockedLimitKeys: ["member_count", "storage_bytes"],
  shouldContactAdmin: false,
  cta: { label: "Review billing", to: "/billing/plans" },
  usageRows: [
    { label: "Active members", value: "21 / 20", state: "blocked" },
    { label: "Storage used", value: "1.1 GB / 1 GB", state: "blocked" },
  ],
};
