import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { useParams } from "react-router";
import { CommentSection } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createKpiDemoFixtures, useKpiDemo } from "../demos";
import { showErrorToast } from "../Toasts";
import { SpaceKpisPage } from "./index";

const kpisLink = "/spaces/space-growth/kpis";
const referenceDate = new Date("2026-07-31T12:00:00Z");

type HarnessArgs = {
  loading?: boolean;
  error?: string | null;
  canManage?: boolean;
  emptySpace?: boolean;
  failMutations?: boolean;
};

function kpiRoute(kpiId?: string) {
  return { reactRouter: { path: kpiId ? `${kpisLink}/${kpiId}` : kpisLink, routePath: `${kpisLink}/*` } };
}

const meta = {
  title: "Pages/SpaceKpisPage",
  component: SpaceKpisPage,
  parameters: { layout: "fullscreen", ...kpiRoute() },
  render: (args: HarnessArgs) => <Harness {...args} />,
} satisfies Meta<HarnessArgs>;

export default meta;
type Story = StoryObj<HarnessArgs>;

function Harness(args: HarnessArgs) {
  const [fixtures] = React.useState(() =>
    createKpiDemoFixtures({ referenceDate, kpisLink, scenario: args.emptySpace ? "empty" : "populated" }),
  );
  // The wildcard route keeps this owner mounted when moving between the list and details.
  const demo = useKpiDemo(fixtures, { mutationDelayMs: 400, failMutations: args.failMutations });
  const { "*": kpiId } = useParams();
  const selectedKpi = demo.kpis.find((kpi) => kpi.id === kpiId) ?? null;
  const subscriptions = kpiId ? demo.getSubscriptionProps(kpiId) : undefined;

  return (
    <SpaceKpisPage
      {...demo.actions}
      space={demo.space}
      navigation={[{ to: demo.space.link, label: demo.space.name }]}
      kpisLink={demo.kpisLink}
      kpis={demo.kpis}
      selectedKpi={selectedKpi}
      currentUser={demo.currentUser}
      championSearch={demo.championSearch}
      richTextHandlers={demo.richTextHandlers}
      loading={args.loading}
      error={args.error}
      canManage={args.canManage}
      subscriptions={
        subscriptions && {
          ...subscriptions,
          onToggle: (subscribed) => {
            void subscriptions
              .onToggle(subscribed)
              .catch((error) => showErrorToast("Could not update demo subscription.", error.message));
          },
        }
      }
      canComment
      renderEntryComments={(entry) => (
        <CommentSection
          {...demo.getCommentProps(entry.id)}
          canComment
          canManageComments
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      )}
    />
  );
}

// The default list view with a healthy set of KPIs across both cadences.
export const Default: Story = {
  args: {},
};

// A single KPI's page, opened on one with lots of history — shows the line
// chart, trend, champion + cadence, and the recorded-updates log.
export const DetailView: Story = {
  parameters: kpiRoute("kpi-mrr"),
};

// The comment thread for a recorded update, opened in a slide-in from the
// "Recorded updates" log. Guards against the composer overflowing the panel.
export const UpdateComments: Story = {
  parameters: kpiRoute("kpi-mrr"),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const toggle = canvasElement.querySelector<HTMLButtonElement>('[data-test-id^="entry-comments-toggle-"]');
    toggle?.click();
  },
};

// Logging an update, including the optional note that the app posts as the
// update's first comment.
export const LogUpdate: Story = {
  parameters: kpiRoute("kpi-mrr"),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[data-test-id="kpi-detail-log-update"]')?.click();
  },
};

// Edge case: a KPI with a single entry can't plot a trend line yet, so its page
// shows a single-value card prompting for another update.
export const SingleEntry: Story = {
  parameters: kpiRoute("kpi-signups"),
};

// Edge case: a brand-new KPI with no entries — empty chart and "No data" states.
export const NoDataYet: Story = {
  parameters: kpiRoute("kpi-churn"),
};

// First-run experience: a space that has not created any KPIs yet.
export const EmptySpace: Story = {
  args: {
    emptySpace: true,
  },
};

// Data still loading via the route loader.
export const Loading: Story = {
  args: {
    loading: true,
  },
};

// The loader failed — surfaced through an error callout.
export const ErrorState: Story = {
  args: {
    error: "The KPIs service is temporarily unavailable.",
  },
};

// Read-only viewer (still any space member in the POC, but shows the UI with
// write actions hidden). No "New KPI" or "Log update" controls appear.
export const ReadOnly: Story = {
  args: {
    canManage: false,
  },
};

// Mutations fail — exercises inline error handling in the New KPI and
// Log update forms. Open a form and submit to see the error message.
export const MutationErrors: Story = {
  args: {
    failMutations: true,
  },
};
