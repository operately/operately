import { Navigation } from "../Page/Navigation";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

export namespace CompanyBillingCancellationPage {
  export type BillingOverview = CompanyBillingPageTypes.BillingOverview;
  export type DetailRow = CompanyBillingPageTypes.DetailRow;

  export interface CancellationSummary {
    rows: DetailRow[];
    consequenceMessage: string;
    consequenceDescription: string;
    overLimitWarning?: {
      message: string;
      description: string;
    } | null;
  }

  export interface Action {
    label: string;
    onClick: () => void;
    loading?: boolean;
  }

  export interface PageViewModel {
    pageTitle: string;
    pageSubtitle: string;
    summary: CancellationSummary;
    errorMessage?: string | null;
    cancelAction: Action;
    keepAction: Action;
  }

  export interface Props {
    title: string | string[];
    billing: BillingOverview;
    navigation?: Navigation.Item[];
    actionError?: string | null;
    isSubmitting?: boolean;
    onCancelPlan?: (() => void) | null;
    onKeepCurrentPlan?: (() => void) | null;
    testId?: string;
  }
}
