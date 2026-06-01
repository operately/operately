import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { InfoCallout, WarningCallout } from "../Callouts";
import { Page } from "../Page";
import type { CompanyBillingCancellationPage as CompanyBillingCancellationPageTypes } from "./types";
import { buildCompanyBillingCancellationPageViewModel } from "./viewModel";

export {
  buildCompanyBillingCancellationPageViewModel,
  buildCompanyBillingCancellationSummary,
} from "./viewModel";

export namespace CompanyBillingCancellationPage {
  export type BillingOverview = CompanyBillingCancellationPageTypes.BillingOverview;
  export type DetailRow = CompanyBillingCancellationPageTypes.DetailRow;
  export type CancellationSummary = CompanyBillingCancellationPageTypes.CancellationSummary;
  export type Action = CompanyBillingCancellationPageTypes.Action;
  export type PageViewModel = CompanyBillingCancellationPageTypes.PageViewModel;
  export type Props = CompanyBillingCancellationPageTypes.Props;
}

export function CompanyBillingCancellationPage(props: CompanyBillingCancellationPage.Props) {
  const viewModel = buildCompanyBillingCancellationPageViewModel(props);

  return (
    <Page title={props.title} size="small" navigation={props.navigation} testId={props.testId}>
      <div className="p-8">
        <Header title={viewModel.pageTitle} subtitle={viewModel.pageSubtitle} />

        <div className="space-y-8">
          {viewModel.errorMessage && (
            <WarningCallout message="Cancellation unavailable" description={viewModel.errorMessage} />
          )}

          <InfoCallout
            message={viewModel.summary.consequenceMessage}
            description={viewModel.summary.consequenceDescription}
          />

          {viewModel.summary.overLimitWarning && (
            <WarningCallout
              message={viewModel.summary.overLimitWarning.message}
              description={viewModel.summary.overLimitWarning.description}
            />
          )}

          <Section title="Downgrade details">
            <SectionCard>
              <DetailRows rows={viewModel.summary.rows} />
            </SectionCard>
          </Section>

          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryButton size="sm" onClick={viewModel.keepAction.onClick}>
              {viewModel.keepAction.label}
            </SecondaryButton>

            <DangerButton size="sm" onClick={viewModel.cancelAction.onClick} loading={viewModel.cancelAction.loading}>
              {viewModel.cancelAction.label}
            </DangerButton>
          </div>
        </div>
      </div>
    </Page>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <div className="text-content-accent text-3xl font-extrabold">{title}</div>
      <div className="mt-2">{subtitle}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
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

function DetailRows({ rows }: { rows: CompanyBillingCancellationPage.DetailRow[] }) {
  return (
    <div className="divide-y divide-stroke-base">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="text-content-dimmed">{row.label}</div>
          <div className="text-right font-medium text-content-accent">{row.value}</div>
        </div>
      ))}
    </div>
  );
}
