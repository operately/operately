import * as api from "@/api";

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
