import { Navigation } from "../Page/Navigation";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

export namespace CompanyBillingPlanSelectionPage {
  export type Interval = CompanyBillingPageTypes.Interval;
  export type Plan = CompanyBillingPageTypes.Plan;
  export type BillingOverview = CompanyBillingPageTypes.BillingOverview;
  export type BillingTarget = CompanyBillingPageTypes.BillingTarget;
  export type BillingTargetSelection = CompanyBillingPageTypes.BillingTargetSelection;
  export type ActionTone = CompanyBillingPageTypes.ActionTone;

  export interface PlanCard {
    key: string;
    title: string;
    priceLabel: string;
    detailLines: string[];
    selected: boolean;
    suggested: boolean;
    disabled: boolean;
    onSelect: () => void;
    testId?: string;
  }

  export interface Action {
    label: string;
    tone: ActionTone;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  }

  export interface SelectionModeView {
    errorMessage?: string | null;
    selectedInterval: Interval;
    onSelectInterval: (interval: Interval) => void;
    cards: PlanCard[];
    continueAction: Action;
  }

  export interface PageViewModel {
    pageTitle: string;
    pageSubtitle: string;
    selection: SelectionModeView;
  }

  export interface Props {
    title: string | string[];
    billing: BillingOverview;
    selection: BillingTargetSelection;
    navigation?: Navigation.Item[];
    actionError?: string | null;
    isStartingCheckout?: boolean;
    onSelectPlan?: ((plan: Plan) => void) | null;
    onSelectInterval?: ((interval: Interval) => void) | null;
    onContinueToCheckout?: (() => void) | null;
    testId?: string;
  }
}
