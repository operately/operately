import React from "react";

import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import type { CompanyBillingPlanSelectionPage as CompanyBillingPlanSelectionPageTypes } from "./types";
import { buildCompanyBillingPlanSelectionPageViewModel } from "./viewModel";

export { buildCompanyBillingPlanSelectionMode, buildCompanyBillingPlanSelectionPageViewModel } from "./viewModel";

export namespace CompanyBillingPlanSelectionPage {
  export type Interval = CompanyBillingPlanSelectionPageTypes.Interval;
  export type Plan = CompanyBillingPlanSelectionPageTypes.Plan;
  export type BillingOverview = CompanyBillingPlanSelectionPageTypes.BillingOverview;
  export type BillingTarget = CompanyBillingPlanSelectionPageTypes.BillingTarget;
  export type BillingTargetSelection = CompanyBillingPlanSelectionPageTypes.BillingTargetSelection;
  export type ActionTone = CompanyBillingPlanSelectionPageTypes.ActionTone;
  export type PlanCard = CompanyBillingPlanSelectionPageTypes.PlanCard;
  export type Action = CompanyBillingPlanSelectionPageTypes.Action;
  export type SelectionModeView = CompanyBillingPlanSelectionPageTypes.SelectionModeView;
  export type PageViewModel = CompanyBillingPlanSelectionPageTypes.PageViewModel;
  export type Props = CompanyBillingPlanSelectionPageTypes.Props;
}

export function CompanyBillingPlanSelectionPage(props: CompanyBillingPlanSelectionPage.Props) {
  const viewModel = buildCompanyBillingPlanSelectionPageViewModel(props);

  return (
    <Page title={props.title} size="small" navigation={props.navigation} testId={props.testId}>
      <div className="p-8">
        <Header title={viewModel.pageTitle} subtitle={viewModel.pageSubtitle} />
        <SelectionModeView selection={viewModel.selection} />
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
      <div>
        <div className="text-content-accent text-3xl font-extrabold">{title}</div>
        <div className="mt-2">{subtitle}</div>
      </div>
    </div>
  );
}

function SelectionModeView({ selection }: { selection: CompanyBillingPlanSelectionPage.SelectionModeView }) {
  return (
    <div className="space-y-10">
      {selection.errorMessage && <WarningCallout message="Checkout unavailable" description={selection.errorMessage} />}

      <BillingCycleSelector selection={selection} />

      <div className="grid gap-4 md:grid-cols-2">
        {selection.cards.map((card) => (
          <PlanCard key={card.key} card={card} />
        ))}
      </div>

      <div className="flex justify-end">
        <ActionButton action={selection.continueAction} size="sm" />
      </div>
    </div>
  );
}

function BillingCycleSelector({ selection }: { selection: CompanyBillingPlanSelectionPage.SelectionModeView }) {
  return (
    <div className="mx-auto w-fit">
      <div className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-content-dimmed">
        Billing cycle
      </div>

      <div className="inline-flex items-center gap-1 rounded-xl border border-stroke-base bg-surface-base p-1 shadow-xs">
        <BillingCycleOption
          active={selection.selectedInterval === "monthly"}
          title="Monthly"
          onClick={() => selection.onSelectInterval("monthly")}
        />
        <BillingCycleOption
          active={selection.selectedInterval === "yearly"}
          title="Yearly"
          onClick={() => selection.onSelectInterval("yearly")}
        />
      </div>
    </div>
  );
}

function BillingCycleOption({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-brand-1 text-surface-base shadow-sm"
          : "text-content-dimmed hover:bg-surface-dimmed hover:text-content-accent",
      ].join(" ")}
      aria-pressed={active}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

function PlanCard({ card }: { card: CompanyBillingPlanSelectionPage.PlanCard }) {
  return (
    <button
      type="button"
      className={[
        "rounded-lg border px-5 py-4 text-left transition",
        card.selected ? "border-brand-1 bg-blue-50/70" : "border-stroke-base bg-surface-base hover:border-brand-1/50",
        card.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
      onClick={card.onSelect}
      disabled={card.disabled}
      data-test-id={card.testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-content-accent text-xl font-extrabold">{card.title}</div>
          <div className="mt-1 text-content-dimmed">{card.priceLabel}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {card.selected && <span className="rounded-full bg-brand-1 px-2 py-1 text-xs font-semibold text-white-1">Selected</span>}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-content-dimmed">
        {card.detailLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </button>
  );
}

function ActionButton({
  action,
  size,
}: {
  action: CompanyBillingPlanSelectionPage.Action;
  size: "xs" | "sm";
}) {
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
