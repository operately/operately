import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconChecks,
  IconCircleCheck,
  IconDoorExit,
  IconFileText,
  IconRefresh,
  IconShieldLock,
  IconSparkles,
  IconWorld,
} from "../icons";

type StepTone = "website" | "app" | "polar" | "system";
type SketchType =
  | "marketing"
  | "auth"
  | "workspace"
  | "billingFree"
  | "billing"
  | "limitBanner"
  | "limitWarning"
  | "joinBlocked"
  | "selection"
  | "companyPicker"
  | "polar"
  | "warning"
  | "payment";

type FlowStep = {
  title: string;
  caption: string;
  notes: string[];
  tone: StepTone;
  sketch: SketchType;
  icon: React.ElementType;
};

type FlowDefinition = {
  title: string;
  summary: string;
  trigger: string;
  steps: FlowStep[];
};

type BillingFlowsWireframeProps = {
  title: string;
  subtitle: string;
  flows: FlowDefinition[];
};

const meta = {
  title: "Wireframes/BillingFlows",
  component: BillingFlowsWireframe,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BillingFlowsWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONE_STYLES: Record<
  StepTone,
  {
    chip: string;
    frame: string;
    ink: string;
    sketch: string;
    label: string;
  }
> = {
  website: {
    chip: "bg-sky-100 text-sky-900 border-sky-300",
    frame: "border-sky-300 bg-sky-50/80",
    ink: "text-sky-950",
    sketch: "border-sky-200",
    label: "Website",
  },
  app: {
    chip: "bg-emerald-100 text-emerald-950 border-emerald-300",
    frame: "border-emerald-300 bg-emerald-50/80",
    ink: "text-emerald-950",
    sketch: "border-emerald-200",
    label: "Operately",
  },
  polar: {
    chip: "bg-amber-100 text-amber-950 border-amber-300",
    frame: "border-amber-300 bg-amber-50/80",
    ink: "text-amber-950",
    sketch: "border-amber-200",
    label: "Polar Hosted",
  },
  system: {
    chip: "bg-rose-100 text-rose-950 border-rose-300",
    frame: "border-rose-300 bg-rose-50/80",
    ink: "text-rose-950",
    sketch: "border-rose-200",
    label: "Operately",
  },
};

const PREVIEW_SOURCE_WIDTH = 620;

const flowLibrary: FlowDefinition[] = [
  {
    title: "Website plan pick, new user",
    summary: "The plan choice becomes intent, not an immediate charge.",
    trigger: "Someone taps Team Yearly on the marketing pricing page.",
    steps: [
      {
        title: "Pricing card sets intent",
        caption: "The CTA carries plan and billing period, but it still behaves like a soft commercial hint.",
        notes: ["Pass `plan=team` and `billing_period=yearly`", "No checkout session yet"],
        tone: "website",
        sketch: "marketing",
        icon: IconWorld,
      },
      {
        title: "Auth gate catches them",
        caption: "The app decides that this visitor needs signup or login first.",
        notes: ["Redirect back to the billing-intent route", "Keep the chosen plan in the URL"],
        tone: "system",
        sketch: "auth",
        icon: IconShieldLock,
      },
      {
        title: "Company creation stays friction-light",
        caption: "They create a company before anything billing-related becomes mandatory.",
        notes: ["Create the company on `free`", "Store Team Yearly as remembered intent"],
        tone: "app",
        sketch: "workspace",
        icon: IconBuilding,
      },
      {
        title: "Company opens normally",
        caption: "The company starts free, but later billing prompts already know what to recommend.",
        notes: ["Billing page can surface Team Yearly later", "Limit prompts can reuse the same suggestion"],
        tone: "app",
        sketch: "billingFree",
        icon: IconSparkles,
      },
    ],
  },
  {
    title: "Website plan pick, logged-in owner with one company",
    summary: "Skip signup and company picking when there is only one possible company to bill.",
    trigger: "An existing owner with one company clicks Business Monthly from the website.",
    steps: [
      {
        title: "Marketing CTA still carries intent",
        caption: "The website never needs to know whether the person is currently authenticated.",
        notes: ["Always hit the app billing-intent route", "Keep the plan semantic, not provider-specific"],
        tone: "website",
        sketch: "marketing",
        icon: IconWorld,
      },
      {
        title: "Billing page opens preselected",
        caption: "The owner lands inside Operately with Business Monthly already staged in the chooser.",
        notes: ["Auto-select the only billable company", "Still wait for explicit confirmation"],
        tone: "app",
        sketch: "selection",
        icon: IconSparkles,
      },
      {
        title: "Polar only appears at payment time",
        caption: "Once the owner confirms, Operately creates the checkout session and hands off securely.",
        notes: ["Card entry happens in Polar", "Return to Billing and refresh after completion"],
        tone: "polar",
        sketch: "polar",
        icon: IconChecks,
      },
    ],
  },
  {
    title: "Website plan pick, logged-in owner with multiple companies",
    summary: "When billing could apply to several companies, let the owner choose the destination first.",
    trigger: "An existing owner who belongs to multiple companies clicks Team Yearly from the website.",
    steps: [
      {
        title: "Marketing CTA still carries intent",
        caption: "The website still only sends semantic plan intent into the app-owned route.",
        notes: ["Plan stays `team`", "Billing period stays `yearly`"],
        tone: "website",
        sketch: "marketing",
        icon: IconWorld,
      },
      {
        title: "Company picker appears",
        caption:
          "Because billing ownership is ambiguous, the app first asks which company should receive the upgrade flow.",
        notes: ["Show only companies the user can manage billing for", "Preselect nothing automatically"],
        tone: "app",
        sketch: "companyPicker",
        icon: IconBuilding,
      },
      {
        title: "Billing opens for the chosen company",
        caption: "After the owner chooses a company, the billing page opens with Team Yearly already selected.",
        notes: ["Carry plan intent through the picker", "Make the chosen company context explicit"],
        tone: "app",
        sketch: "selection",
        icon: IconSparkles,
      },
      {
        title: "Polar only appears at payment time",
        caption: "Secure payment still stays provider-hosted and only begins after explicit confirmation in the app.",
        notes: ["Card entry happens in Polar", "Return to Billing and refresh after completion"],
        tone: "polar",
        sketch: "polar",
        icon: IconChecks,
      },
    ],
  },
  {
    title: "Upgrade starts from a plan limit",
    summary: "A blocked action becomes a clear upgrade ramp instead of a dead end, with copy that shifts by role.",
    trigger: "A free company hits the member or storage cap.",
    steps: [
      {
        title: "Limit block explains why",
        caption: "The interruption should feel informative, not punitive.",
        notes: [
          "Show current usage versus the current plan limit",
          "Reuse the same block pattern for invite creation and uploads",
          "Use the remembered plan if one exists",
        ],
        tone: "system",
        sketch: "limitWarning",
        icon: IconAlertTriangle,
      },
      {
        title: "Message adapts to permissions",
        caption: "The blocked state should make the next step obvious for owners, company admins, and regular members.",
        notes: [
          "Owners can jump directly to Billing",
          "Company admins see upgrade guidance without checkout authority",
          "Members are told to contact an owner or admin",
        ],
        tone: "app",
        sketch: "limitWarning",
        icon: IconShieldLock,
      },
      {
        title: "Plan selection stays in-app for owners",
        caption: "Owners land directly in plan selection with context already attached before any provider handoff.",
        notes: ["Pre-highlight the suggested paid plan", "Monthly vs Yearly", "Tiny summary of what changes next"],
        tone: "app",
        sketch: "selection",
        icon: IconCalendar,
      },
      {
        title: "Checkout confirms the purchase",
        caption: "Polar handles secure card entry and payment confirmation.",
        notes: ["Return to Billing after success", "Webhook or refresh updates the final state"],
        tone: "polar",
        sketch: "polar",
        icon: IconCircleCheck,
      },
    ],
  },
  {
    title: "Approaching a limit before work is blocked",
    summary: "A soft warning should invite an upgrade before uploads or invites start failing.",
    trigger: "An owner or company admin crosses 90% of the member or storage limit.",
    steps: [
      {
        title: "Banner appears in normal workspace pages",
        caption: "The warning should live in the everyday product UI, not only on the Billing page.",
        notes: [
          "Show current usage and the suggested upgrade",
          "Keep the tone invitational rather than error-like",
          "Do not block uploads or invites yet",
        ],
        tone: "app",
        sketch: "limitBanner",
        icon: IconSparkles,
      },
      {
        title: "Dismissal only buys time",
        caption: "People can hide the banner for a while, but it should come back after a cooldown.",
        notes: [
          "Persist dismissal in local storage",
          "Scope it by company and warning type",
          "Bring the banner back later instead of hiding it forever",
        ],
        tone: "system",
        sketch: "limitBanner",
        icon: IconRefresh,
      },
      {
        title: "Upgrade CTA respects permissions",
        caption:
          "Owners can continue toward checkout, while company admins still get the nudge without becoming billing owners.",
        notes: [
          "Owners can open Billing or plan selection",
          "Company admins can be pointed toward the workspace owner",
          "Regular members do not see this banner at all",
        ],
        tone: "app",
        sketch: "limitBanner",
        icon: IconShieldLock,
      },
    ],
  },
  {
    title: "Invite join blocked when the company is full",
    summary: "Invite acceptance should fail cleanly and explain that only a plan upgrade can reopen the door.",
    trigger: "Someone accepts an invite after the company already reached its member limit.",
    steps: [
      {
        title: "Join is stopped before workspace access is granted",
        caption:
          "The company-join operation rechecks capacity instead of assuming that an older invite is still valid.",
        notes: [
          "Do not partially create the company membership",
          "Do not drop the person inside the workspace and error later",
          "Redirect to a dedicated limit page instead of a generic failure",
        ],
        tone: "system",
        sketch: "joinBlocked",
        icon: IconShieldLock,
      },
      {
        title: "Dedicated page explains who can fix it",
        caption:
          "The invitee should land on a calm page that says the company is full and an owner or admin must upgrade it.",
        notes: [
          "Keep the company name visible",
          "Do not show a checkout CTA to the invitee",
          "Make it clear that retrying can work after an upgrade",
        ],
        tone: "app",
        sketch: "joinBlocked",
        icon: IconAlertTriangle,
      },
    ],
  },
  {
    title: "Change plan or billing period",
    summary: "Existing subscribers can switch plans without leaving the app until secure confirmation is needed.",
    trigger: "An owner wants to move from Team Monthly to Business Yearly.",
    steps: [
      {
        title: "Billing home shows the current state",
        caption: "The starting point is always a readable plan summary with a clear change action.",
        notes: ["Current plan", "Renewal timing", "Usage snapshot"],
        tone: "app",
        sketch: "billing",
        icon: IconSparkles,
      },
      {
        title: "Chooser reframes the decision",
        caption: "The owner sees the current plan, target plan, interval, and a simple before/after summary.",
        notes: ["Highlight the selected destination", "Keep the current plan visibly anchored"],
        tone: "app",
        sketch: "selection",
        icon: IconCalendar,
      },
      {
        title: "Final state returns to Billing",
        caption: "However the change is applied, the owner should end up back on the same billing home.",
        notes: ["Show the new plan clearly", "Keep auditability with dates and status"],
        tone: "app",
        sketch: "billing",
        icon: IconChecks,
      },
    ],
  },
  {
    title: "Update credit card",
    summary: "The app owns the lead-in, but the sensitive form stays hosted by Polar.",
    trigger: "An owner wants to replace an expiring card.",
    steps: [
      {
        title: "Payment method section anchors the action",
        caption: "The owner finds card management exactly where they expect it: on the billing page.",
        notes: ["Optional masked-card summary", "A single obvious `Update credit card` action"],
        tone: "app",
        sketch: "payment",
        icon: IconFileText,
      },
      {
        title: "Polar-hosted card manager",
        caption: "Sensitive payment edits happen in the provider-hosted flow, not in Operately.",
        notes: ["Card edit UI lives in Polar", "Operately waits for return and refresh"],
        tone: "polar",
        sketch: "polar",
        icon: IconChecks,
      },
      {
        title: "Return with refreshed summary",
        caption: "After the handoff, Billing should still feel like the canonical home for the result.",
        notes: ["Refresh local billing projection", "Keep core actions available even if enrichment is delayed"],
        tone: "app",
        sketch: "billing",
        icon: IconRefresh,
      },
    ],
  },
  {
    title: "Cancel, then reactivate before the end date",
    summary: "The owner should understand the downgrade clearly, then be able to reverse it just as clearly.",
    trigger: "A company wants to stop paying but may change its mind before the billing period ends.",
    steps: [
      {
        title: "Billing home starts the cancellation",
        caption: "Cancellation is easy to find, but it should never feel abrupt or unexplained.",
        notes: ["Start from the main actions area", "Keep current plan and renewal context visible"],
        tone: "app",
        sketch: "billing",
        icon: IconDoorExit,
      },
      {
        title: "Consequence modal explains the downgrade",
        caption: "This screen should focus on what changes at period end, especially free-plan limits.",
        notes: ["Show end-of-access date", "Warn if the company will be over free limits"],
        tone: "system",
        sketch: "warning",
        icon: IconAlertTriangle,
      },
      {
        title: "Scheduled cancellation state",
        caption: "After confirmation, Billing shifts into a calmer waiting state instead of an error state.",
        notes: ["Display `cancel at period end` clearly", "Keep a `Keep plan` action visible"],
        tone: "app",
        sketch: "billing",
        icon: IconCalendar,
      },
      {
        title: "Reactivation is one step away",
        caption:
          "If the owner changes their mind before the date passes, they should not need to restart from scratch.",
        notes: ["Use a direct reactivation action", "Return to the normal paid state after sync"],
        tone: "app",
        sketch: "selection",
        icon: IconCircleCheck,
      },
    ],
  },
];

const entryFlows = flowLibrary.slice(0, 3);
const upgradeFlows = flowLibrary.slice(3, 8);
const lifecycleFlows = flowLibrary.slice(8);

export const Overview: Story = {
  args: {
    title: "Billing and Payment Flow Wireframes",
    subtitle:
      "Loose, annotated flow sketches that show where people go next. These are intentionally rough and omit visual detail.",
    flows: flowLibrary,
  },
};

export const EntryPoints: Story = {
  args: {
    title: "Website Entry Points",
    subtitle:
      "How the pricing site should branch users into signup, company creation, company picking, or Billing without guessing too early.",
    flows: entryFlows,
  },
};

export const UpgradeAndPaymentHandoffs: Story = {
  args: {
    title: "Upgrade and Payment Handoffs",
    subtitle: "The app should own decisions and recommendations, while Polar only appears for secure payment moments.",
    flows: upgradeFlows,
  },
};

export const CancellationLifecycle: Story = {
  args: {
    title: "Cancellation and Reactivation",
    subtitle: "A clear downgrade explanation followed by a calm waiting state and an easy path back.",
    flows: lifecycleFlows,
  },
};

function BillingFlowsWireframe({ title, subtitle, flows }: BillingFlowsWireframeProps) {
  return (
    <div
      className="min-h-screen px-6 py-10 text-stone-900 sm:px-8 lg:px-10"
      style={{
        backgroundColor: "#f8f2e8",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(92,72,44,0.14) 1px, transparent 0), linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))",
        backgroundSize: "22px 22px, 100% 100%",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-[28px] border-2 border-stone-900 bg-[#fffaf1] px-6 py-8 sm:px-8">
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg">{subtitle}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LegendChip tone="website" />
            <LegendChip tone="app" />
            <LegendChip tone="polar" />
            <LegendChip tone="system" />
          </div>
        </header>

        <div className="space-y-8">
          {flows.map((flow, index) => (
            <FlowSection key={flow.title} flow={flow} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowSection({ flow, index }: { flow: FlowDefinition; index: number }) {
  return (
    <section className="rounded-[30px] border-2 border-stone-900 bg-white/80 p-4 backdrop-blur-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border-2 border-dashed border-stone-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">
            Flow {index + 1}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-stone-950 sm:text-3xl">{flow.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700 sm:text-base">{flow.summary}</p>
        </div>

        <div className="max-w-sm rounded-[22px] border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Trigger</div>
          {flow.trigger}
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-stretch gap-3 pr-2">
          {flow.steps.map((step, stepIndex) => (
            <React.Fragment key={step.title}>
              <FlowCard step={step} index={stepIndex} />
              {stepIndex < flow.steps.length - 1 ? <ArrowBridge /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowCard({ step, index }: { step: FlowStep; index: number }) {
  const style = TONE_STYLES[step.tone];
  const TiltIcon = step.icon;

  return (
    <article
      className={`${style.frame} ${style.ink} flex w-[360px] shrink-0 flex-col rounded-[26px] border-2 border-dashed p-4 sm:w-[420px] xl:w-[460px]`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${style.chip}`}
        >
          <TiltIcon size={14} />
          {style.label}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-xs font-black text-stone-950">
          {index + 1}
        </div>
      </div>

      <h3 className="text-lg font-black tracking-tight">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-700">{step.caption}</p>

      <div className="mt-4">
        <ZoomedScreen>
          <SketchFrame sketch={step.sketch} tone={step.tone} />
        </ZoomedScreen>
      </div>

      <ul className="mt-4 space-y-2">
        {step.notes.map((note) => (
          <li key={note} className="flex items-start gap-2 text-sm leading-5 text-stone-800">
            <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-stone-900" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ArrowBridge() {
  return (
    <div className="flex shrink-0 items-center justify-center py-1 xl:w-12 xl:py-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-stone-900 bg-[#fffaf1] text-stone-900">
        <IconArrowRight className="h-5 w-5" />
      </div>
    </div>
  );
}

function ZoomedScreen({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const update = () => {
      const nextWidth = containerRef.current?.clientWidth ?? 0;
      const nextHeight = contentRef.current?.offsetHeight ?? 0;

      setAvailableWidth((current) => (current === nextWidth ? current : nextWidth));
      setContentHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    update();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(update);

    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  const scale = availableWidth > 0 ? availableWidth / PREVIEW_SOURCE_WIDTH : 1;
  const scaledHeight = contentHeight > 0 ? contentHeight * scale : undefined;

  return (
    <div className="rounded-[18px] border border-stone-300 bg-white p-2">
      <div ref={containerRef} className="rounded-[14px] bg-white">
        <div style={scaledHeight ? { height: scaledHeight } : undefined}>
          <div
            className="origin-top-left"
            style={{
              width: PREVIEW_SOURCE_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div ref={contentRef}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ tone }: { tone: StepTone }) {
  const style = TONE_STYLES[tone];

  return (
    <div className={`rounded-[18px] border-2 border-dashed px-4 py-3 ${style.frame}`}>
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${style.chip}`}
      >
        {style.label}
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        {tone === "website" ? "Public marketing touchpoint." : null}
        {tone === "app" ? "Operately-owned context, choices, and summaries." : null}
        {tone === "polar" ? "Provider-hosted secure payment step." : null}
        {tone === "system" ? "Decision rule, sync, or enforcement logic." : null}
      </p>
    </div>
  );
}

function SketchFrame({ sketch, tone }: { sketch: SketchType; tone: StepTone }) {
  const style = TONE_STYLES[tone];

  return (
    <div
      className={`w-[620px] rounded-[20px] border-2 border-dashed bg-white p-3 ${style.sketch}`}
      style={{ backgroundColor: "#ffffff" }}
    >
      {sketch === "marketing" ? <MarketingSketch /> : null}
      {sketch === "auth" ? <AuthSketch /> : null}
      {sketch === "workspace" ? <WorkspaceSketch /> : null}
      {sketch === "billingFree" ? <BillingFreeSketch /> : null}
      {sketch === "billing" ? <BillingSketch /> : null}
      {sketch === "limitBanner" ? <LimitBannerSketch /> : null}
      {sketch === "limitWarning" ? <LimitWarningSketch /> : null}
      {sketch === "joinBlocked" ? <JoinBlockedSketch /> : null}
      {sketch === "selection" ? <SelectionSketch /> : null}
      {sketch === "companyPicker" ? <CompanyPickerSketch /> : null}
      {sketch === "polar" ? <PolarSketch /> : null}
      {sketch === "warning" ? <WarningSketch /> : null}
      {sketch === "payment" ? <PaymentSketch /> : null}
    </div>
  );
}

function MarketingSketch() {
  return (
    <BrowserFrame url="operately.com/pricing" sectionLabel="pricing page">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3 rounded-[18px] border-2 border-dashed border-stone-300 bg-sky-50/70 p-4">
          <div className="max-w-[62%] space-y-2">
            <SectionEyebrow>operately cloud</SectionEyebrow>
            <SketchText width="w-44" size="lg" />
            <SketchText width="w-32" />
            <SketchText width="w-28" />
            <div className="pt-2">
              <SketchButton label="Start with Team Yearly" primary />
            </div>
          </div>
          <div className="grid w-[34%] gap-2 rounded-[16px] border-2 border-dashed border-stone-300 bg-white p-3">
            <SketchBadge>Yearly selected</SketchBadge>
            <SketchText width="w-14" dark />
            <SketchText width="w-20" />
            <SketchText width="w-16" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PlanSummaryCard title="Team" subtitle="$79 / month billed yearly" selected />
          <PlanSummaryCard title="Business" subtitle="$199 / month" />
        </div>
      </div>
    </BrowserFrame>
  );
}

function AuthSketch() {
  return (
    <BrowserFrame url="app.operately.com/sign_up" sectionLabel="auth gate">
      <div className="grid grid-cols-[0.95fr_1.05fr] gap-4 p-4">
        <div className="rounded-[18px] border-2 border-dashed border-stone-300 bg-stone-50/80 p-4">
          <SectionEyebrow>why you are here</SectionEyebrow>
          <SketchText width="w-32" dark size="md" className="mt-2" />
          <SketchText width="w-28" />
          <SketchText width="w-24" />
          <div className="mt-4 rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-3">
            <SketchLabel>plan intent</SketchLabel>
            <SketchBadge>Team / yearly</SketchBadge>
          </div>
        </div>

        <div className="rounded-[18px] border-2 border-stone-900 bg-white p-4">
          <SectionEyebrow>create account</SectionEyebrow>
          <div className="mt-3 space-y-2">
            <InputRow label="Work email" />
            <InputRow label="Password" />
            <InputRow label="Full name" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SketchButton label="Continue" primary />
            <SketchButton label="Google" />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function WorkspaceSketch() {
  return (
    <BrowserFrame url="app.operately.com/new" sectionLabel="company setup">
      <div className="space-y-4 p-4">
        <PageHeader title="Create your company" actionLabel="Save and continue" />
        <div className="grid grid-cols-2 gap-3">
          <InfoPanel title="Company details">
            <InputRow label="Company name" />
            <InputRow label="Short URL" />
            <InputRow label="Industry" />
          </InfoPanel>
          <InfoPanel title="Workspace defaults">
            <InputRow label="Team size" />
            <InputRow label="Timezone" />
            <div className="mt-3 rounded-[14px] border-2 border-dashed border-emerald-300 bg-emerald-50 p-3">
              <SketchLabel>remembered upgrade hint</SketchLabel>
              <SketchBadge>Team yearly</SketchBadge>
            </div>
          </InfoPanel>
        </div>
      </div>
    </BrowserFrame>
  );
}

function BillingFreeSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="billing home">
      <div className="space-y-4 p-4">
        <PageHeader title="Billing" actionLabel="See plans" />
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
          <InfoPanel title="Current plan" accent="emerald">
            <div className="flex items-center justify-between gap-3">
              <SketchText width="w-20" dark size="md" />
              <SketchBadge>free</SketchBadge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MiniMetric label="members" value="18 / 20" />
              <MiniMetric label="storage" value="0.8 / 1 GB" />
            </div>
            <div className="mt-3 rounded-[14px] border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <SketchLabel>suggested upgrade</SketchLabel>
              <div className="mt-2 flex items-center justify-between gap-2">
                <SketchBadge>Team yearly</SketchBadge>
                <SketchText width="w-20" />
              </div>
            </div>
          </InfoPanel>

          <div className="space-y-3">
            <InfoPanel title="Free limits">
              <div className="space-y-2">
                <SummaryRow left="Members" right="20 max" />
                <SummaryRow left="Storage" right="1 GB max" />
                <SummaryRow left="Recommended" right="Team yearly" bold />
              </div>
            </InfoPanel>
            <InfoPanel title="Actions">
              <div className="grid gap-2">
                <SketchButton label="Upgrade now" primary />
                <SketchButton label="Compare plans" />
              </div>
            </InfoPanel>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function BillingSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="billing home">
      <div className="space-y-4 p-4">
        <PageHeader title="Billing" actionLabel="Change plan" />
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
          <InfoPanel title="Current plan" accent="emerald">
            <div className="flex items-center justify-between gap-3">
              <SketchText width="w-20" dark size="md" />
              <SketchBadge>Business monthly</SketchBadge>
            </div>
            <div className="mt-3 space-y-2">
              <SummaryRow left="Renews" right="Jun 14" />
              <SummaryRow left="Status" right="Active" bold />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniMetric label="members" value="42 / 200" />
              <MiniMetric label="storage" value="81 / 1024 GB" />
            </div>
          </InfoPanel>

          <div className="space-y-3">
            <InfoPanel title="Payment method" accent="amber" highlighted>
              <div className="flex items-center gap-3 rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-3">
                <div className="flex h-12 w-16 items-center justify-center rounded-[12px] border-2 border-stone-300 bg-stone-50 text-[11px] font-black uppercase tracking-[0.12em] text-stone-500">
                  card
                </div>
                <div className="space-y-1">
                  <SketchText width="w-20" dark />
                  <SketchText width="w-14" />
                </div>
              </div>
              <div className="mt-3">
                <SketchButton label="Update credit card" />
              </div>
            </InfoPanel>
            <InfoPanel title="Actions">
              <div className="grid gap-2">
                <SketchButton label="Manage invoices" />
                <SketchButton label="Cancel plan" />
              </div>
            </InfoPanel>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function SelectionSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="plan selection">
      <div className="space-y-4 p-4">
        <PageHeader title="Choose a plan" actionLabel="Continue to checkout" />
        <div className="mx-auto w-44 rounded-full border-2 border-dashed border-stone-300 bg-stone-50 p-1">
          <div className="grid grid-cols-2 gap-1">
            <ToggleOption label="Monthly" />
            <ToggleOption label="Yearly" selected />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PlanDetailCard
            title="Team"
            price="$79 / mo"
            selected
            bullets={["50 members", "100 GB storage", "recommended"]}
          />
          <PlanDetailCard
            title="Business"
            price="$199 / mo"
            bullets={["200 members", "1 TB storage", "advanced admin"]}
          />
        </div>

        <div className="rounded-[18px] border-2 border-dashed border-stone-300 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SketchLabel>What happens next</SketchLabel>
              <SketchText width="w-36" dark />
            </div>
            <SketchButton label="Continue" primary />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function CompanyPickerSketch() {
  return (
    <BrowserFrame url="app.operately.com/billing/select-company" sectionLabel="company picker">
      <div className="space-y-4 p-4">
        <PageHeader title="Choose a company" actionLabel="Continue" />
        <div className="rounded-[18px] border-2 border-dashed border-stone-300 bg-stone-50 p-3">
          <SketchLabel>selected plan</SketchLabel>
          <div className="mt-2 flex items-center justify-between gap-3">
            <SketchBadge>Team yearly</SketchBadge>
            <SketchText width="w-28" />
          </div>
        </div>

        <div className="grid gap-3">
          <CompanyOptionCard name="Acme Inc" subtitle="Owner access" selected />
          <CompanyOptionCard name="Northstar Labs" subtitle="Owner access" />
          <CompanyOptionCard name="Harbor Ops" subtitle="Owner access" />
        </div>
      </div>
    </BrowserFrame>
  );
}

function PolarSketch() {
  return (
    <BrowserFrame url="polar.sh/checkout" sectionLabel="provider checkout">
      <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 p-4">
        <div className="rounded-[18px] border-2 border-dashed border-amber-300 bg-amber-50 p-4">
          <SectionEyebrow>order summary</SectionEyebrow>
          <SketchText width="w-28" dark className="mt-2" />
          <SketchText width="w-20" />
          <div className="mt-4 space-y-2 rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-3">
            <SummaryRow left="Plan" right="Business monthly" />
            <SummaryRow left="Workspace" right="Acme Inc" />
            <SummaryRow left="Total" right="$199" bold />
          </div>
        </div>

        <div className="rounded-[18px] border-2 border-stone-900 bg-white p-4">
          <SectionEyebrow>secure payment</SectionEyebrow>
          <div className="mt-3 space-y-2">
            <InputRow label="Card number" />
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="Expiry" />
              <InputRow label="CVC" />
            </div>
            <InputRow label="Name on card" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <SketchBadge>Hosted by Polar</SketchBadge>
            <SketchButton label="Confirm subscription" primary />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function WarningSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="warning state">
      <div className="space-y-4 bg-stone-100/70 p-4 pb-6">
        <PageHeader title="Billing" />

        <div className="rounded-[22px] border-2 border-stone-900 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionEyebrow>before you continue</SectionEyebrow>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-stone-900">
                Cancellation at period end
              </div>
              <p className="mt-2 max-w-[26rem] text-[11px] leading-5 text-stone-700">
                Paid access continues until May 31. After that, this workspace returns to the free plan limits.
              </p>
            </div>
            <SketchBadge>May 31</SketchBadge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border-2 border-dashed border-rose-300 bg-rose-50 p-3">
              <SketchLabel>after downgrade</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Members" right="20 max" />
                <SummaryRow left="Storage" right="1 GB max" />
                <SummaryRow left="Status" right="Free plan" />
              </div>
            </div>

            <div className="rounded-[16px] border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <SketchLabel>current usage</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Members" right="26 in use" bold />
                <SummaryRow left="Storage" right="0.8 GB" />
                <SummaryRow left="Risk" right="Over free limits" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SketchButton label="Keep plan" />
            <SketchButton label="Confirm cancellation" primary />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 opacity-40">
          <MutedPanel />
          <MutedPanel />
        </div>
      </div>
    </BrowserFrame>
  );
}

function LimitBannerSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/projects" sectionLabel="usage warning">
      <div className="space-y-4 bg-stone-100/70 p-4 pb-6">
        <PageHeader title="Projects" actionLabel="New project" />

        <div className="rounded-[22px] border-2 border-stone-900 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="max-w-[29rem]">
              <SectionEyebrow>almost at your plan limit</SectionEyebrow>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-stone-900">
                You are getting close to the storage cap
              </div>
              <p className="mt-2 text-[11px] leading-5 text-stone-700">
                Upgrade soon to keep uploads and invites moving without interruptions for the team.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SketchBadge>90%</SketchBadge>
              <div className="flex h-8 w-8 items-center justify-center rounded-[12px] border-2 border-dashed border-stone-300 bg-white text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                X
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1.05fr_0.95fr] gap-3">
            <div className="rounded-[16px] border-2 border-dashed border-stone-300 bg-white p-3">
              <SketchLabel>current usage</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Members" right="18 / 20" />
                <SummaryRow left="Storage" right="0.91 / 1 GB" bold />
                <SummaryRow left="Suggested plan" right="Team yearly" />
              </div>
            </div>

            <div className="rounded-[16px] border-2 border-dashed border-emerald-300 bg-emerald-50 p-3">
              <SketchLabel>next step</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="State" right="Nothing blocked yet" bold />
                <SummaryRow left="CTA" right="Review plans" />
                <SummaryRow left="Audience" right="Owner or admin" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <SketchButton label="Dismiss" />
                <SketchButton label="Review plans" primary />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border-2 border-dashed border-stone-300 bg-white p-3">
            <SketchLabel>temporary dismissal</SketchLabel>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <MiniMetric label="storage" value="warning state" />
              <MiniMetric label="local" value="saved per company" />
              <MiniMetric label="return" value="after cooldown" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 opacity-40">
          <MutedPanel />
          <MutedPanel />
        </div>
      </div>
    </BrowserFrame>
  );
}

function LimitWarningSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="limit block">
      <div className="space-y-4 bg-stone-100/70 p-4 pb-6">
        <PageHeader title="Invite teammates" actionLabel="Send invite" />

        <div className="rounded-[22px] border-2 border-stone-900 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionEyebrow>plan limit reached</SectionEyebrow>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-stone-900">
                This workspace is full for its current plan
              </div>
              <p className="mt-2 max-w-[26rem] text-[11px] leading-5 text-stone-700">
                Upgrade this workspace to keep adding teammates or storage without blocking the team.
              </p>
            </div>
            <SketchBadge>Team yearly</SketchBadge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border-2 border-dashed border-rose-300 bg-rose-50 p-3">
              <SketchLabel>current usage</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Members" right="20 / 20" bold />
                <SummaryRow left="Storage" right="0.98 / 1 GB" />
                <SummaryRow left="Blocked action" right="Invite teammate" />
              </div>
            </div>

            <div className="rounded-[16px] border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <SketchLabel>recommended plan</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Plan" right="Team yearly" bold />
                <SummaryRow left="Members" right="50 included" />
                <SummaryRow left="Storage" right="100 GB" />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border-2 border-dashed border-stone-300 bg-stone-50 p-3">
            <SketchLabel>next step changes by role</SketchLabel>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <RoleOutcomeCard title="Owner" action="Open billing" detail="Can continue to checkout" primary />
              <RoleOutcomeCard title="Company admin" action="Review limits" detail="Sees upgrade guidance only" />
              <RoleOutcomeCard title="Member" action="Contact owner" detail="No upgrade CTA in this state" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SketchButton label="Back" />
            <SketchButton label="Open billing" primary />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 opacity-40">
          <MutedPanel />
          <MutedPanel />
        </div>
      </div>
    </BrowserFrame>
  );
}

function JoinBlockedSketch() {
  return (
    <BrowserFrame url="app.operately.com/join/acme/limit" sectionLabel="join blocked">
      <div className="space-y-4 bg-stone-100/70 p-6 pb-8">
        <div className="mx-auto max-w-[28rem] rounded-[24px] border-2 border-stone-900 bg-white p-5">
          <SectionEyebrow>invite paused</SectionEyebrow>
          <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-stone-900">
            This company has reached its member limit
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-700">
            You cannot join Acme Inc yet. A company owner or admin needs to upgrade the workspace plan before this
            invite can be completed.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border-2 border-dashed border-rose-300 bg-rose-50 p-3">
              <SketchLabel>workspace</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Company" right="Acme Inc" bold />
                <SummaryRow left="Members" right="20 / 20" />
                <SummaryRow left="Invite" right="On hold" />
              </div>
            </div>

            <div className="rounded-[16px] border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <SketchLabel>what to do next</SketchLabel>
              <div className="mt-2 space-y-2">
                <SummaryRow left="Contact" right="Owner or admin" bold />
                <SummaryRow left="Upgrade" right="Required first" />
                <SummaryRow left="Retry" right="After the plan changes" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SketchButton label="Back" />
            <SketchButton label="Try again later" primary />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function PaymentSketch() {
  return (
    <BrowserFrame url="app.operately.com/acme/admin/billing" sectionLabel="payment method">
      <div className="space-y-4 p-4">
        <PageHeader title="Billing" />
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
          <InfoPanel title="Current plan">
            <SummaryRow left="Plan" right="Business monthly" bold />
            <SummaryRow left="Renews" right="Jun 14" />
            <SummaryRow left="Status" right="Active" />
          </InfoPanel>

          <InfoPanel title="Payment method" accent="amber" highlighted>
            <div className="flex items-center gap-3 rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-3">
              <div className="flex h-12 w-16 items-center justify-center rounded-[12px] border-2 border-stone-300 bg-stone-50 text-[11px] font-black uppercase tracking-[0.12em] text-stone-500">
                card
              </div>
              <div className="space-y-1">
                <SketchText width="w-20" dark />
                <SketchText width="w-14" />
              </div>
            </div>
            <div className="mt-3">
              <SketchButton label="Update credit card" primary />
            </div>
          </InfoPanel>
        </div>
      </div>
    </BrowserFrame>
  );
}

function BrowserFrame({
  url,
  sectionLabel,
  children,
}: {
  url: string;
  sectionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border-2 border-stone-900 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b-2 border-stone-900/80 bg-stone-100 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full border border-stone-900 bg-rose-200" />
          <div className="h-2.5 w-2.5 rounded-full border border-stone-900 bg-amber-200" />
          <div className="h-2.5 w-2.5 rounded-full border border-stone-900 bg-emerald-200" />
        </div>
        <div className="ml-2 flex-1 rounded-full border-2 border-dashed border-stone-300 bg-white px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-stone-600">
          {url}
        </div>
        <div className="rounded-full border border-stone-300 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">
          {sectionLabel}
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function PageHeader({ title, actionLabel }: { title: string; actionLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[18px] border-2 border-dashed border-stone-300 bg-white p-3">
      <div>
        <SectionEyebrow>page header</SectionEyebrow>
        <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-stone-900">{title}</div>
        <SketchText width="w-28" className="mt-2" />
      </div>
      {actionLabel ? <SketchButton label={actionLabel} primary compact /> : null}
    </div>
  );
}

function InfoPanel({
  title,
  children,
  accent,
  highlighted,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "emerald" | "amber";
  highlighted?: boolean;
}) {
  const accentClasses =
    accent === "amber"
      ? "bg-amber-50 border-amber-300"
      : accent === "emerald"
        ? "bg-emerald-50 border-emerald-300"
        : "bg-white border-stone-300";

  return (
    <div
      className={`rounded-[18px] border-2 p-3 ${highlighted ? "border-stone-900" : "border-dashed"} ${accentClasses}`}
    >
      <SectionEyebrow>{title}</SectionEyebrow>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CompanyOptionCard({ name, subtitle, selected }: { name: string; subtitle: string; selected?: boolean }) {
  return (
    <div
      className={`rounded-[18px] p-3 ${
        selected ? "border-2 border-stone-900 bg-white" : "border-2 border-dashed border-stone-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-900">{name}</div>
          <SketchText width="w-20" className="mt-2" />
        </div>
        <div className="space-y-2 text-right">
          <SketchBadge>{subtitle}</SketchBadge>
          {selected ? <SketchBadge>selected</SketchBadge> : <SketchButton label="Choose" compact />}
        </div>
      </div>
    </div>
  );
}

function PlanSummaryCard({ title, subtitle, selected }: { title: string; subtitle: string; selected?: boolean }) {
  return (
    <div
      className={`rounded-[18px] p-3 ${
        selected ? "border-2 border-stone-900 bg-white" : "border-2 border-dashed border-stone-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-900">{title}</div>
        {selected ? <SketchBadge>picked</SketchBadge> : null}
      </div>
      <div className="mt-2 text-[11px] font-semibold text-stone-600">{subtitle}</div>
      <div className="mt-3">
        <SketchButton label={selected ? "Selected" : "Choose"} primary={selected} compact />
      </div>
    </div>
  );
}

function PlanDetailCard({
  title,
  price,
  bullets,
  selected,
}: {
  title: string;
  price: string;
  bullets: string[];
  selected?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] p-3 ${
        selected ? "border-2 border-stone-900 bg-white" : "border-2 border-dashed border-stone-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-900">{title}</div>
          <div className="mt-1 text-[11px] font-semibold text-stone-600">{price}</div>
        </div>
        {selected ? <SketchBadge>recommended</SketchBadge> : null}
      </div>
      <div className="mt-3 space-y-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-2 text-[11px] text-stone-700">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <SketchButton label={selected ? "Selected" : "Pick plan"} primary={selected} compact />
      </div>
    </div>
  );
}

function RoleOutcomeCard({
  title,
  action,
  detail,
  primary,
}: {
  title: string;
  action: string;
  detail: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <SketchLabel>{title}</SketchLabel>
        {primary ? <SketchBadge>checkout path</SketchBadge> : null}
      </div>
      <div className="mt-2 text-[11px] font-black uppercase tracking-[0.08em] text-stone-900">{action}</div>
      <div className="mt-2 text-[11px] leading-5 text-stone-600">{detail}</div>
    </div>
  );
}

function ToggleOption({ label, selected }: { label: string; selected?: boolean }) {
  return (
    <div
      className={`rounded-full px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.14em] ${
        selected
          ? "border-2 border-stone-900 bg-white text-stone-900"
          : "border-2 border-dashed border-stone-300 text-stone-500"
      }`}
    >
      {label}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border-2 border-dashed border-stone-300 bg-white p-2">
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{label}</div>
      <div className="mt-1 text-[11px] font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function SummaryRow({ left, right, bold }: { left: string; right: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="font-black uppercase tracking-[0.1em] text-stone-500">{left}</span>
      <span className={bold ? "font-black text-stone-900" : "font-semibold text-stone-700"}>{right}</span>
    </div>
  );
}

function InputRow({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <SketchLabel>{label}</SketchLabel>
      <div className="h-8 rounded-[12px] border-2 border-dashed border-stone-300 bg-white" />
    </div>
  );
}

function MutedPanel() {
  return (
    <div className="rounded-[18px] border-2 border-dashed border-stone-300 bg-white p-3">
      <SketchText width="w-20" dark />
      <SketchText width="w-28" className="mt-2" />
      <SketchText width="w-24" />
      <div className="mt-3 h-8 rounded-[12px] border-2 border-dashed border-stone-300 bg-stone-50" />
    </div>
  );
}

function SketchButton({ label, primary, compact }: { label: string; primary?: boolean; compact?: boolean }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-[12px] border-2 px-3 text-[10px] font-black uppercase tracking-[0.14em] ${
        compact ? "h-8" : "h-9 w-full"
      } ${
        primary
          ? "border-stone-900 bg-lime-100 text-stone-950"
          : "border-dashed border-stone-300 bg-white text-stone-600"
      }`}
    >
      {label}
    </div>
  );
}

function SketchBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-stone-300 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-stone-600">
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-500">{children}</div>;
}

function SketchLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{children}</div>;
}

function SketchText({
  width,
  dark,
  size,
  className,
}: {
  width: string;
  dark?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={`${width} rounded-full ${dark ? "bg-stone-900" : "bg-stone-300"} ${size === "lg" ? "h-3.5" : size === "md" ? "h-3" : "h-2"} ${
        className || ""
      }`}
    />
  );
}
