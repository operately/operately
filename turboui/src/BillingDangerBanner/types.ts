type BillingDangerUsageRowState = "blocked" | "near_limit";

interface BillingDangerUsageRow {
  label: string;
  value: string;
  state: BillingDangerUsageRowState;
}

type PaymentDefaultMode = "payment_grace" | "read_only";

interface PaymentDefaultDangerBannerViewModel {
  kind: "payment_default";
  mode: PaymentDefaultMode;
  title: string;
  deadline: string | null;
  shouldContactAdmin: boolean;
  cta: { label: string; to: string } | null;
}

interface OverLimitDangerBannerViewModel {
  kind: "over_limit";
  mode: "over_limit";
  title: string;
  blockedLimitKeys: string[];
  usageRows: BillingDangerUsageRow[];
  shouldContactAdmin: boolean;
  cta: { label: string; to: string } | null;
}

export type BillingDangerBannerViewModel = PaymentDefaultDangerBannerViewModel | OverLimitDangerBannerViewModel;
