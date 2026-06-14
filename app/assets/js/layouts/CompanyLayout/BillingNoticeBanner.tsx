import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import * as Companies from "@/models/companies";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { IconInfoCircleFilled, IconX } from "turboui";

const STORAGE_NAMESPACE = "announcements";
const STORAGE_KEY = "billing-notice-2026-06-29-dismissed";
const ROLLOUT_DATE = "2026-06-29";

export function BillingNoticeBanner() {
  const { company } = useCompanyLoaderData();
  const [dismissed, setDismissed] = useStateWithLocalStorage(STORAGE_NAMESPACE, STORAGE_KEY, false);

  const billingEnabled = window.appConfig.billingEnabled;
  const hasBillingNotice = Companies.hasFeature(company, "billing-notice");
  const canManageBilling = Boolean(company.permissions?.canManageBilling);

  if (!billingEnabled || !hasBillingNotice || dismissed) {
    return null;
  }

  return (
    <div
      className="border-b border-surface-outline bg-yellow-50 text-yellow-950"
      data-test-id="billing-notice-banner"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-200 bg-yellow-100 text-yellow-700 shadow-sm">
            <IconInfoCircleFilled size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-yellow-950">New billing and plans are coming to Operately</div>
            <p className="mt-1 text-sm leading-6 text-yellow-900">
              Starting <FormattedTime format="long-date" time={ROLLOUT_DATE} />, Operately will roll out company billing
              and plans. {canManageBilling ? "You'll" : "Admins and owners will"} be able to review
              plan options, usage, and billing details in Company Administration. Member and storage limits will depend
              on the company's plan. No action is required today.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mt-0.5 shrink-0 rounded-md p-1 text-yellow-700 transition-colors hover:bg-yellow-100 hover:text-yellow-900"
          data-test-id="billing-notice-banner-dismiss"
          aria-label="Dismiss billing notice"
          onClick={() => setDismissed(true)}
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}
