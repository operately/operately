import { Navigation } from "../Page/Navigation";

export namespace CompanyBillingPage {
  export type Mode = "overview" | "confirming";
  export type Status = "free" | "active" | "past_due" | "canceled";
  export type Interval = "monthly" | "yearly";
  export type Plan = "team" | "business";
  export type ChangeTargetPlan = Plan | "free";
  export type BillingTargetSource = "query" | "pending" | "scheduled" | "current" | "suggested" | "catalog";
  export type NoticeTone = "info" | "warning" | "danger";
  export type ActionTone = "primary" | "secondary" | "danger";
  export type ActionKind = "featured" | "support" | "recovery" | "danger";
  export type FeedbackKind = "success" | "pending" | "incomplete";
  export type ChangeTiming = "immediate" | "next_renewal";
  export type OverageKind = "none" | "member" | "storage" | "member_and_storage";

  export interface BillingAccount {
    planKey?: Plan | null;
    billingInterval?: Interval | null;
    status: Status;
    suggestedPlanKey?: Plan | null;
    suggestedBillingInterval?: Interval | null;
    suggestedPlanSource?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd: boolean;
    pendingPlanKey?: Plan | null;
    pendingBillingInterval?: Interval | null;
    pendingCheckoutStartedAt?: string | null;
    scheduledPlanKey?: Plan | null;
    scheduledBillingInterval?: Interval | null;
    scheduledChangeEffectiveAt?: string | null;
    accessState?: "normal" | "payment_grace" | "over_limit_grace" | "read_only";
    accessStateReason?: "past_due" | "over_limit_after_downgrade" | null;
    accessStateStartedAt?: string | null;
    accessStateEndsAt?: string | null;
  }

  export interface BillingPlanDefinition {
    key: string;
    displayName: string;
    memberLimit: number;
    storageLimitBytes: number;
  }

  export interface BillingCatalogProduct {
    planFamily: Plan;
    billingInterval: Interval;
    polarProductName?: string | null;
    priceAmount?: number | null;
    priceCurrency?: string | null;
    active: boolean;
  }

  export interface BillingOverview {
    account: BillingAccount;
    plans: BillingPlanDefinition[];
    catalogProducts: BillingCatalogProduct[];
    memberCount: number;
    storageUsageBytes: number;
    stale: boolean;
  }

  export interface BillingTarget {
    plan: Plan;
    billingInterval: Interval;
    product?: BillingCatalogProduct | null;
  }

  export interface ChangeConsequence {
    targetPlanKey: ChangeTargetPlan;
    targetPlanLabel: string;
    timing: ChangeTiming;
    effectiveDate?: string | null;
    isLowerEntitlement: boolean;
    memberCount: number;
    memberLimit: number | null;
    memberOverage: number;
    storageUsageBytes: number;
    storageLimitBytes: number | null;
    storageOverageBytes: number;
    overageKind: OverageKind;
  }

  export interface BillingSearchParams {
    rawPlan: string | null;
    rawBillingPeriod: string | null;
    plan: Plan | null;
    billingInterval: Interval | null;
    checkoutId: string | null;
    hasSelectionIntent: boolean;
  }

  export interface BillingTargetSelection {
    target: BillingTarget | null;
    source: BillingTargetSource | null;
    warning: string | null;
  }

  export interface DetailRow {
    label: string;
    value: string;
  }

  export interface Notice {
    tone: NoticeTone;
    message: string;
    description: string;
  }

  export interface Action {
    label: string;
    title: string;
    description: string;
    kind: ActionKind;
    tone: ActionTone;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  }

  export interface HeaderAction {
    label: string;
    onClick: () => void;
  }

  export interface Feedback {
    kind: FeedbackKind;
    message: string;
    description: string;
  }

  export interface CurrentPlan {
    name: string;
    intervalLabel?: string | null;
    status: Status;
    rows: DetailRow[];
  }

  export interface OverviewModeView {
    stale: boolean;
    currentPlan: CurrentPlan;
    usageRows: DetailRow[];
    statusNotices: Notice[];
    actions: Action[];
    emptyStatusMessage?: string;
    feedback?: Feedback | null;
    errorMessage?: string | null;
  }

  export interface ConfirmingModeView {
    notice: Notice;
    rows: DetailRow[];
  }

  export interface PageViewModel {
    pageTitle: string;
    pageSubtitle: string;
    headerAction?: HeaderAction | null;
    mode: Mode;
    overview?: OverviewModeView;
    confirming?: ConfirmingModeView;
  }

  export interface Props {
    title: string | string[];
    billing: BillingOverview;
    navigation?: Navigation.Item[];
    feedback?: Feedback | null;
    actionError?: string | null;
    isConfirmingCheckout?: boolean;
    confirmingTarget?: BillingTarget | null;
    onOpenSelection?: (() => void) | null;
    onCompleteUpgrade?: (() => void) | null;
    onCancelPlan?: (() => void) | null;
    onReactivatePlan?: (() => void) | null;
    onUpdatePaymentMethod?: (() => void) | null;
    onManageBilling?: (() => void) | null;
    onRefreshBilling?: (() => void) | null;
    testId?: string;
  }
}
