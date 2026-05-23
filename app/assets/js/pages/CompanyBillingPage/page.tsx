import * as Billing from "@/models/billing";
import * as Callouts from "@/components/Callouts";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { useLoadedData } from "./loader";
import { usePaths } from "@/routes/paths";
import { useRouteLoaderData } from "react-router-dom";

interface CompanyRootData {
  company?: {
    name?: string | null;
  } | null;
}

interface BillingOverviewContentProps {
  billing: Billing.BillingOverview;
}

export function Page() {
  const paths = usePaths();
  const { billing } = useLoadedData();
  const companyRootData = useRouteLoaderData("companyRoot") as CompanyRootData | undefined;

  const companyName = companyRootData?.company?.name || "Billing";

  return (
    <Pages.Page title={[companyName, "Billing"]} testId="company-billing-page">
      <Paper.Root size="small">
        <Paper.NavigateBack to={paths.companyAdminPath()} title="Back to Company Admin" />

        <Paper.Body>
          <Paper.Header title="Billing" subtitle="Review the current subscription state for this workspace." />

          <BillingOverviewContent billing={billing} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export function BillingOverviewContent({ billing }: BillingOverviewContentProps) {
  const currentPlan = Billing.getCurrentPlanDefinition(billing);
  const currentPlanName =
    currentPlan?.displayName || Billing.formatPlanName(billing.account.planKey, billing.account.status === "free" ? "Free" : "Unknown plan");

  const currentInterval = Billing.formatIntervalLabel(billing.account.billingInterval);
  const suggestedPlan = billing.account.suggestedPlanKey ? Billing.findPlanDefinition(billing.plans, billing.account.suggestedPlanKey) : null;
  const suggestedPlanLabel = Billing.formatPlanLabel(billing.account.suggestedPlanKey, billing.account.suggestedBillingInterval);
  const suggestedSource = Billing.formatSuggestedPlanSource(billing.account.suggestedPlanSource);
  const memberLimit = currentPlan?.memberLimit;
  const statusNotices = buildStatusNotices(billing);

  return (
    <div className="space-y-10">
      {billing.stale && (
        <Callouts.WarningCallout
          message="Billing data may be out of date"
          description="We could not reach Polar on the last sync. Reload the page to try again."
          testId="billing-stale-callout"
        />
      )}

      <Paper.Section title="Current plan">
        <SectionCard>
          <div className="flex flex-col gap-3 border-b border-stroke-base pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-content-accent text-2xl font-extrabold">{currentPlanName}</div>
              {currentInterval && <div className="mt-1 text-content-dimmed">{currentInterval} billing</div>}
            </div>

            <BillingStatusBadge status={billing.account.status} />
          </div>

          <DetailRows
            rows={[
              currentInterval ? { label: "Billing interval", value: currentInterval } : null,
              formatPeriodEndRow(billing.account),
            ]}
          />
        </SectionCard>
      </Paper.Section>

      <Paper.Section title="Usage and limits">
        <SectionCard>
          <DetailRows
            rows={[
              { label: "Active members", value: `${billing.memberCount}` },
              { label: "Member limit", value: memberLimit ? `${memberLimit}` : "Unavailable" },
            ]}
          />
        </SectionCard>
      </Paper.Section>

      {billing.account.suggestedPlanKey && (
        <Paper.Section title="Recommended next plan">
          <SectionCard>
            <DetailRows
              rows={[
                { label: "Suggested plan", value: suggestedPlan?.displayName || suggestedPlanLabel },
                billing.account.suggestedBillingInterval
                  ? { label: "Billing interval", value: Billing.formatIntervalLabel(billing.account.suggestedBillingInterval) || "Unavailable" }
                  : null,
                suggestedSource ? { label: "Source", value: suggestedSource } : null,
              ]}
            />
          </SectionCard>
        </Paper.Section>
      )}

      <Paper.Section title="Status details">
        <div className="space-y-3">
          {statusNotices.length === 0 ? (
            <div className="rounded-lg border border-stroke-base bg-surface-dimmed px-4 py-3 text-content-dimmed">
              No pending billing changes.
            </div>
          ) : (
            statusNotices.map((notice) => <NoticeCallout key={notice.message} notice={notice} />)
          )}
        </div>
      </Paper.Section>
    </div>
  );
}

type NoticeTone = "info" | "warning";

export interface Notice {
  tone: NoticeTone;
  message: string;
  description: string;
}

export function buildStatusNotices(billing: Billing.BillingOverview): Notice[] {
  const notices: Notice[] = [];

  if (billing.account.pendingPlanKey) {
    notices.push({
      tone: "info",
      message: "Checkout in progress",
      description: [
        `We're waiting for checkout completion for ${Billing.formatPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval)}.`,
        formatRelativeDateLine("Checkout started", billing.account.pendingCheckoutStartedAt),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.scheduledPlanKey) {
    notices.push({
      tone: "info",
      message: "Scheduled plan change",
      description: [
        `${Billing.formatPlanLabel(billing.account.scheduledPlanKey, billing.account.scheduledBillingInterval)} will take effect at the next renewal.`,
        formatRelativeDateLine("Effective on", billing.account.scheduledChangeEffectiveAt),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.cancelAtPeriodEnd) {
    notices.push({
      tone: "warning",
      message: "Cancellation scheduled",
      description:
        formatRelativeDateLine("The current subscription remains active until", billing.account.currentPeriodEnd) ||
        "The current subscription will end at the close of the current billing period.",
    });
  }

  if (billing.account.status === "past_due") {
    notices.push({
      tone: "warning",
      message: "Payment issue detected",
      description: "Polar reports this subscription as past due. Billing access may be affected until payment is resolved.",
    });
  }

  if (billing.account.status === "canceled") {
    notices.push({
      tone: "warning",
      message: "Subscription ended",
      description: "This workspace is no longer on an active paid subscription.",
    });
  }

  if (billing.account.status === "free" && notices.length === 0) {
    notices.push({
      tone: "info",
      message: "Free plan",
      description: "This workspace is currently using the free plan.",
    });
  }

  return notices;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-stroke-base bg-surface-base px-5 py-4">{children}</div>;
}

export function BillingStatusBadge({ status }: { status: Billing.BillingStatus }) {
  const className = {
    free: "border-emerald-200 bg-emerald-50 text-emerald-700",
    active: "border-blue-200 bg-blue-50 text-blue-700",
    past_due: "border-amber-200 bg-amber-50 text-amber-800",
    canceled: "border-stone-200 bg-stone-100 text-stone-700",
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${className}`}>
      {Billing.formatStatusLabel(status)}
    </span>
  );
}

function DetailRows({ rows }: { rows: Array<{ label: string; value: string } | null> }) {
  const presentRows = rows.filter((row): row is { label: string; value: string } => row !== null);

  if (presentRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 divide-y divide-stroke-base">
      {presentRows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="text-content-dimmed">{row.label}</div>
          <div className="text-right font-medium text-content-accent">{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function NoticeCallout({ notice }: { notice: Notice }) {
  if (notice.tone === "warning") {
    return <Callouts.WarningCallout message={notice.message} description={notice.description} />;
  }

  return <Callouts.InfoCallout message={notice.message} description={notice.description} />;
}

function formatPeriodEndRow(account: Billing.BillingAccount): { label: string; value: string } | null {
  const formattedDate = formatDate(account.currentPeriodEnd);
  if (!formattedDate) return null;

  if (account.cancelAtPeriodEnd || account.status === "canceled") {
    return { label: "Current period ends", value: formattedDate };
  }

  return { label: "Renews", value: formattedDate };
}

function formatRelativeDateLine(prefix: string, value?: string | null): string | null {
  const formattedDate = formatDate(value);
  if (!formattedDate) return null;

  return `${prefix} ${formattedDate}.`;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
