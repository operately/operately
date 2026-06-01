import * as api from "@/api";

export type BillingViewerRole = "owner" | "company_admin" | "regular";

type BillingCompanyAccessState = api.BillingCompanyAccessState;

interface PaymentDefaultBannerRoutes {
  companyBillingPath: () => string;
}

export interface PaymentDefaultBannerViewModel {
  mode: "payment_grace" | "read_only";
  title: string;
  deadline: string | null;
  cta: { label: string; to: string } | null;
}

export function buildPaymentDefaultBanner(
  accessState: BillingCompanyAccessState | null | undefined,
  role: BillingViewerRole,
  routes: PaymentDefaultBannerRoutes,
): PaymentDefaultBannerViewModel | null {
  if (!accessState) {
    return null;
  }

  if (!isPaymentRecoveryAccessState(accessState)) {
    return null;
  }

  const checkedAccessState = accessState;

  return {
    mode: checkedAccessState.accessState === "read_only" ? "read_only" : "payment_grace",
    title: checkedAccessState.accessState === "read_only" ? "This company is read-only" : "Payment issue requires attention",
    deadline: checkedAccessState.accessStateEndsAt || null,
    cta: role === "owner" ? { label: "Review billing", to: routes.companyBillingPath() } : null,
  };
}

export function isPaymentRecoveryAccessState(
  accessState:
    | Pick<api.BillingCompanyAccessState, "accessState" | "accessStateReason">
    | Pick<api.BillingAccount, "accessState" | "accessStateReason">
    | null
    | undefined,
) {
  return (
    accessState?.accessStateReason === "past_due" &&
    (accessState.accessState === "payment_grace" || accessState.accessState === "read_only")
  );
}
