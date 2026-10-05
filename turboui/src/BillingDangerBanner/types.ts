type BillingDangerUsageRowState = "blocked" | "near_limit";

interface BillingDangerUsageRow {
  limitKey: "member_count" | "storage_bytes";
  value: string;
  state: BillingDangerUsageRowState;
}

type PaymentDefaultMode = "payment_grace" | "read_only";

interface PaymentDefaultDangerBannerViewModel {
  kind: "payment_default";
  mode: PaymentDefaultMode;
  deadline: string | null;
  shouldContactAdmin: boolean;
  cta: { to: string } | null;
}

interface OverLimitDangerBannerViewModel {
  kind: "over_limit";
  mode: "over_limit";
  blockedLimitKeys: string[];
  usageRows: BillingDangerUsageRow[];
  shouldContactAdmin: boolean;
  cta: { to: string } | null;
}

export type BillingDangerBannerViewModel = PaymentDefaultDangerBannerViewModel | OverLimitDangerBannerViewModel;
