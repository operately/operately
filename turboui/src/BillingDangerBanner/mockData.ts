import type { BillingDangerBannerViewModel } from "./types";

export const paymentBanner: Extract<BillingDangerBannerViewModel, { kind: "payment_default" }> = {
  kind: "payment_default",
  mode: "payment_grace",
  deadline: "2026-06-15T00:00:00Z",
  shouldContactAdmin: false,
  cta: { to: "/billing" },
};

export const limitBanner: Extract<BillingDangerBannerViewModel, { kind: "over_limit" }> = {
  kind: "over_limit",
  mode: "over_limit",
  blockedLimitKeys: ["member_count", "storage_bytes"],
  shouldContactAdmin: false,
  cta: { to: "/billing/plans" },
  usageRows: [
    { limitKey: "member_count", value: "21 / 20", state: "blocked" },
    { limitKey: "storage_bytes", value: "1.1 GB / 1 GB", state: "blocked" },
  ],
};
