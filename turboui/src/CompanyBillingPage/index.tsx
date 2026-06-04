import React from "react";

import { ErrorCallout, InfoCallout, SuccessCallout, WarningCallout } from "../Callouts";
import { Page } from "../Page";
import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "./types";
import { buildCompanyBillingPageViewModel } from "./viewModel";

export {
  buildCompanyBillingConfirmingMode,
  buildCompanyBillingOverviewMode,
  buildCompanyBillingPageViewModel,
  buildCompanyBillingStatusNotices,
} from "./viewModel";
export {
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
  buildCompanyBillingCancellationFeedback,
  buildCompanyBillingPlanChangeFeedback,
  buildCompanyBillingReactivationFeedback,
  buildCompanyBillingRecoveryFeedback,
  buildCompanyBillingSuccessFeedback,
  findCompanyBillingPlanDefinition,
  formatCompanyBillingChangeTimingDescription,
  formatCompanyBillingDate,
  formatCompanyBillingIntervalLabel,
  formatCompanyBillingPlanLabel,
  formatCompanyBillingPlanName,
  formatCompanyBillingPriceFromMinorUnits,
  formatCompanyBillingRelativeDateLine,
  getCompanyBillingCurrentPlanDefinition,
  resolveCompanyBillingChangeTiming,
  formatStorageBytes,
} from "../CompanyBilling";
export {
  canCreateCompanyBillingCheckout,
  findCompanyBillingSellableProduct,
  getCompanyBillingCurrentTarget,
  getCompanyBillingPendingTarget,
  getCompanyBillingScheduledTarget,
  getCompanyBillingSuggestedTarget,
  isCompanyBillingCheckoutReturnSuccessful,
  isCompanyBillingPaidStatus,
  listCompanyBillingSellableTargets,
  matchesCompanyBillingTarget,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
} from "../CompanyBilling";

export namespace CompanyBillingPage {
  export type Mode = CompanyBillingPageTypes.Mode;
  export type Status = CompanyBillingPageTypes.Status;
  export type Interval = CompanyBillingPageTypes.Interval;
  export type Plan = CompanyBillingPageTypes.Plan;
  export type ChangeTargetPlan = CompanyBillingPageTypes.ChangeTargetPlan;
  export type BillingTargetSource = CompanyBillingPageTypes.BillingTargetSource;
  export type NoticeTone = CompanyBillingPageTypes.NoticeTone;
  export type ActionTone = CompanyBillingPageTypes.ActionTone;
  export type ActionKind = CompanyBillingPageTypes.ActionKind;
  export type FeedbackKind = CompanyBillingPageTypes.FeedbackKind;
  export type ChangeTiming = CompanyBillingPageTypes.ChangeTiming;
  export type OverageKind = CompanyBillingPageTypes.OverageKind;

  export type BillingAccount = CompanyBillingPageTypes.BillingAccount;
  export type BillingPlanDefinition = CompanyBillingPageTypes.BillingPlanDefinition;
  export type BillingCatalogProduct = CompanyBillingPageTypes.BillingCatalogProduct;
  export type BillingOverview = CompanyBillingPageTypes.BillingOverview;
  export type BillingTarget = CompanyBillingPageTypes.BillingTarget;
  export type ChangeConsequence = CompanyBillingPageTypes.ChangeConsequence;
  export type BillingSearchParams = CompanyBillingPageTypes.BillingSearchParams;
  export type BillingTargetSelection = CompanyBillingPageTypes.BillingTargetSelection;

  export type DetailRow = CompanyBillingPageTypes.DetailRow;
  export type Notice = CompanyBillingPageTypes.Notice;
  export type Action = CompanyBillingPageTypes.Action;
  export type Feedback = CompanyBillingPageTypes.Feedback;
  export type CurrentPlan = CompanyBillingPageTypes.CurrentPlan;
  export type OverviewModeView = CompanyBillingPageTypes.OverviewModeView;
  export type ConfirmingModeView = CompanyBillingPageTypes.ConfirmingModeView;
  export type PageViewModel = CompanyBillingPageTypes.PageViewModel;
  export type Props = CompanyBillingPageTypes.Props;
}

export function CompanyBillingPage(props: CompanyBillingPage.Props) {
  const viewModel = buildCompanyBillingPageViewModel(props);

  return (
    <Page title={props.title} size="small" navigation={props.navigation} testId={props.testId}>
      <div className="p-8">
        <Header title={viewModel.pageTitle} subtitle={viewModel.pageSubtitle} />

        {viewModel.mode === "overview" && viewModel.overview && <OverviewModeView overview={viewModel.overview} />}
        {viewModel.mode === "confirming" && viewModel.confirming && <ConfirmingModeView confirming={viewModel.confirming} />}
      </div>
    </Page>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <div className="text-content-accent text-3xl font-extrabold">{title}</div>
        <div className="mt-2">{subtitle}</div>
      </div>
    </div>
  );
}

function OverviewModeView({ overview }: { overview: CompanyBillingPage.OverviewModeView }) {
  return (
    <div className="space-y-10">
      {overview.feedback && <FeedbackBlock feedback={overview.feedback} />}

      {overview.errorMessage && <WarningCallout message="Billing action unavailable" description={overview.errorMessage} />}

      {overview.stale && (
        <WarningCallout
          message="Billing data may be out of date"
          description="We could not reach Polar on the last sync. Reload the page to try again."
        />
      )}

      <Section title="Current plan">
        <SectionCard>
          <div className="flex flex-col gap-3 border-b border-stroke-base pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-content-accent text-2xl font-extrabold">{overview.currentPlan.name}</div>
              {overview.currentPlan.intervalLabel && <div className="mt-1 text-content-dimmed">{overview.currentPlan.intervalLabel} billing</div>}
            </div>

            <BillingStatusBadge status={overview.currentPlan.status} />
          </div>

          <DetailRows rows={overview.currentPlan.rows} />
        </SectionCard>
      </Section>

      <Section title="Usage and limits">
        <SectionCard>
          <DetailRows rows={overview.usageRows} />
        </SectionCard>
      </Section>

      <Section title="Status details">
        <div className="space-y-3">
          {overview.statusNotices.length === 0 ? (
            <div className="rounded-lg border border-stroke-base bg-surface-dimmed px-4 py-3 text-content-dimmed">
              {overview.emptyStatusMessage || "No pending billing changes."}
            </div>
          ) : (
            overview.statusNotices.map((notice) => <StatusDetailNotice key={notice.message} notice={notice} />)
          )}
        </div>
      </Section>

      {overview.actions.length > 0 && (
        <Section title="Actions">
          <BillingActionsPanel actions={overview.actions} />
        </Section>
      )}
    </div>
  );
}

function ConfirmingModeView({ confirming }: { confirming: CompanyBillingPage.ConfirmingModeView }) {
  return (
    <div className="space-y-6">
      <NoticeCallout notice={confirming.notice} />

      <Section title="Checkout status">
        <SectionCard>
          <DetailRows rows={confirming.rows} />
        </SectionCard>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <div className="mb-2">
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-stroke-base bg-surface-base px-5 py-4">{children}</div>;
}

function DetailRows({ rows }: { rows: CompanyBillingPage.DetailRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 divide-y divide-stroke-base">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="text-content-dimmed">{row.label}</div>
          <div className="text-right font-medium text-content-accent">{row.value}</div>
        </div>
      ))}
    </div>
  );
}


function BillingStatusBadge({ status }: { status: CompanyBillingPage.Status }) {
  const className = {
    free: "border-emerald-200 bg-emerald-50 text-emerald-700",
    active: "border-blue-200 bg-blue-50 text-blue-700",
    past_due: "border-amber-200 bg-amber-50 text-amber-800",
    canceled: "border-stone-200 bg-stone-100 text-stone-700",
  }[status];

  const label = {
    free: "Free",
    active: "Active",
    past_due: "Past due",
    canceled: "Canceled",
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${className}`}>
      {label}
    </span>
  );
}

function NoticeCallout({ notice }: { notice: CompanyBillingPage.Notice }) {
  if (notice.tone === "danger") {
    return <ErrorCallout message={notice.message} description={notice.description} />;
  }

  if (notice.tone === "warning") {
    return <WarningCallout message={notice.message} description={notice.description} />;
  }

  return <InfoCallout message={notice.message} description={notice.description} />;
}

function StatusDetailNotice({ notice }: { notice: CompanyBillingPage.Notice }) {
  const toneClasses = {
    info: {
      wrapper: "border-sky-200 bg-sky-50/70",
      badge: "bg-sky-100 text-sky-800",
      title: "text-sky-950",
    },
    warning: {
      wrapper: "border-amber-200 bg-amber-50/80",
      badge: "bg-amber-100 text-amber-900",
      title: "text-amber-950",
    },
    danger: {
      wrapper: "border-rose-200 bg-rose-50/80",
      badge: "bg-rose-100 text-rose-900",
      title: "text-rose-950",
    },
  }[notice.tone];

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses.wrapper}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 rounded-full px-2 py-1 text-xs font-semibold ${toneClasses.badge}`}>
          {notice.tone === "danger" ? "Danger" : notice.tone === "warning" ? "Warning" : "Info"}
        </span>

        <div className="min-w-0">
          <div className={`font-semibold ${toneClasses.title}`}>{notice.message}</div>
          <div className="mt-1 text-sm text-content-dimmed">{notice.description}</div>
        </div>
      </div>
    </div>
  );
}

function FeedbackBlock({ feedback }: { feedback: CompanyBillingPage.Feedback }) {
  if (feedback.kind === "success") {
    return <SuccessCallout message={feedback.message} description={feedback.description} />;
  }

  if (feedback.kind === "pending") {
    return <InfoCallout message={feedback.message} description={feedback.description} />;
  }

  return <WarningCallout message={feedback.message} description={feedback.description} />;
}

function BillingActionsPanel({ actions }: { actions: CompanyBillingPage.Action[] }) {
  const featuredAction = actions.find((action) => action.kind === "featured") || null;
  const supportActions = actions.filter((action) => action.kind === "support");
  const recoveryActions = actions.filter((action) => action.kind === "recovery");
  const dangerActions = actions.filter((action) => action.kind === "danger");

  return (
    <SectionCard>
      <div className="space-y-4">
        {featuredAction && <FeaturedAction action={featuredAction} />}

        {(supportActions.length > 0 || recoveryActions.length > 0) && (
          <div className="overflow-hidden rounded-xl border border-stroke-base bg-surface-dimmed/40">
            {supportActions.map((action) => (
              <ManagementActionRow key={action.label} action={action} />
            ))}

            {recoveryActions.map((action) => (
              <RecoveryActionRow key={action.label} action={action} />
            ))}
          </div>
        )}

        {dangerActions.map((action) => (
          <DangerActionCard key={action.label} action={action} />
        ))}
      </div>
    </SectionCard>
  );
}

function FeaturedAction({ action }: { action: CompanyBillingPage.Action }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ActionCopy action={action} />
        <div className="sm:flex-shrink-0">
          <ActionButton action={action} size="sm" />
        </div>
      </div>
    </div>
  );
}

function ManagementActionRow({ action }: { action: CompanyBillingPage.Action }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between [&+&]:border-t [&+&]:border-stroke-base">
      <ActionCopy action={action} />
      <div className="sm:flex-shrink-0">
        <ActionButton action={action} size="xs" />
      </div>
    </div>
  );
}

function RecoveryActionRow({ action }: { action: CompanyBillingPage.Action }) {
  return (
    <div className="flex flex-col gap-4 border-t border-emerald-200 bg-emerald-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <ActionCopy action={action} />
      <div className="sm:flex-shrink-0">
        <ActionButton action={action} size="xs" />
      </div>
    </div>
  );
}

function DangerActionCard({ action }: { action: CompanyBillingPage.Action }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ActionCopy action={action} />
        <div className="sm:flex-shrink-0">
          <ActionButton action={action} size="xs" />
        </div>
      </div>
    </div>
  );
}

function ActionCopy({ action }: { action: CompanyBillingPage.Action }) {
  return (
    <div className="min-w-0">
      <div className="font-semibold text-content-accent">{action.title}</div>
      <div className="mt-1 text-sm text-content-dimmed">{action.description}</div>
    </div>
  );
}

function ActionButton({
  action,
  size,
}: {
  action: CompanyBillingPage.Action;
  size: "xs" | "sm";
}) {
  if (action.tone === "danger") {
    return (
      <DangerButton size={size} onClick={action.onClick} disabled={action.disabled} loading={action.loading}>
        {action.label}
      </DangerButton>
    );
  }

  if (action.tone === "secondary") {
    return (
      <SecondaryButton size={size} onClick={action.onClick} disabled={action.disabled} loading={action.loading}>
        {action.label}
      </SecondaryButton>
    );
  }

  return (
    <PrimaryButton size={size} onClick={action.onClick} disabled={action.disabled} loading={action.loading}>
      {action.label}
    </PrimaryButton>
  );
}
