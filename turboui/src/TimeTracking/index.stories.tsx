import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { TimeTrackingDemo } from "./stories/TimeTrackingDemo";

const meta = {
  title: "Features/Time Tracking",
  tags: ["time-tracking"],
  component: TimeTrackingDemo,
  parameters: { layout: "fullscreen", reactRouter: { routePath: "*" } },
  args: { initialView: "project", role: "manager", scenario: "default" },
  argTypes: {
    initialView: { control: "select", options: ["project", "task", "space-task"] },
    role: { control: "select", options: ["manager", "member", "guest", "viewer"] },
    scenario: {
      control: "select",
      options: [
        "default",
        "empty",
        "loading",
        "error",
        "slow-save",
        "save-error",
        "disabled",
        "long-timer",
        "closed-task",
      ],
    },
  },
  render: (args) => (
    <TimeTrackingDemo key={`${args.initialView}-${args.role}-${args.scenario}-${args.locale}`} {...args} />
  ),
} satisfies Meta<typeof TimeTrackingDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ConnectedDemo: Story = {};
export const ProjectTime: Story = {
  args: { initialView: "project" },
  parameters: { reactRouter: { path: "/projects/launch?tab=overview", routePath: "*" } },
};
export const TaskTime: Story = { args: { initialView: "task" } };
export const SpaceTask: Story = {
  args: { initialView: "space-task" },
  parameters: { reactRouter: { path: "/spaces/product/kanban?taskId=task-research", routePath: "*" } },
};
export const Empty: Story = { args: { scenario: "empty" } };
export const Loading: Story = { args: { scenario: "loading" } };
export const LoadError: Story = { args: { scenario: "error" } };
export const SlowSave: Story = { args: { scenario: "slow-save" } };
export const SaveError: Story = { args: { scenario: "save-error" } };
export const TrackingDisabled: Story = {
  args: { scenario: "disabled", initialView: "project" },
  parameters: { reactRouter: { path: "/projects/launch?tab=overview", routePath: "*" } },
};
export const TeamMember: Story = {
  args: { role: "member", initialView: "project" },
  parameters: { reactRouter: { path: "/projects/launch?tab=overview", routePath: "*" } },
};
export const Guest: Story = {
  args: { role: "guest", initialView: "project" },
  parameters: { reactRouter: { path: "/projects/launch?tab=overview", routePath: "*" } },
};
export const ReadOnly: Story = { args: { role: "viewer" } };
export const ForgottenTimer: Story = { args: { scenario: "long-timer" } };
export const CompletedTaskWithTimer: Story = { args: { scenario: "closed-task", initialView: "task" } };
export const PortugueseFormatting: Story = { args: { locale: "pt-BR" } };
export const Mobile: Story = {
  render: () => (
    <iframe
      title="Time tracking on mobile"
      src="/iframe.html?id=features-time-tracking--connected-demo&viewMode=story"
      className="mx-auto border border-stroke-base"
      style={{ width: 390, maxWidth: "100%", height: 844 }}
    />
  ),
};

export const LogAndReviewTime: Story = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Log time" }));
    await userEvent.type(await body.findByLabelText("Duration"), "1h 30m");
    await userEvent.type(body.getByLabelText("Notes (optional)"), "Planning the launch");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    const total = canvasElement.querySelector('[data-test-id="project-time-total"]');
    await expect(total).not.toHaveTextContent(/^0/);
    await userEvent.click(canvas.getByRole("button", { name: "Time entry actions for Alex Morgan" }));
    await userEvent.click(body.getByRole("menuitem", { name: "Edit" }));
    await expect(body.getByLabelText("Notes (optional)")).toHaveValue("Planning the launch");
    await userEvent.clear(await body.findByLabelText("Duration"));
    await userEvent.type(body.getByLabelText("Duration"), "45m");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(total).toHaveTextContent("45m");
    await userEvent.click(canvas.getByRole("button", { name: "Time entry actions for Alex Morgan" }));
    await userEvent.click(body.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(body.getByRole("button", { name: "Delete entry" }));
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-test-id="time-entry-list"]')).not.toBeInTheDocument(),
    );
  },
};

export const TimerAcrossPages: Story = {
  args: { initialView: "task", scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Start timer" }));
    await canvas.findByRole("timer");
    await userEvent.click(canvas.getByRole("button", { name: "Project" }));
    await expect(canvas.getByRole("timer")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Timer actions" }));
    await userEvent.click(body.getByRole("menuitem", { name: "Switch" }));
    await userEvent.click(await body.findByRole("button", { name: "Save and switch" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "General project work" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Stop" }));
    await waitFor(() => expect(canvas.queryByRole("timer")).not.toBeInTheDocument());
    await expect(canvasElement.querySelector('[data-test-id="project-time-total"]')).not.toHaveTextContent(/^0/);
  },
};

export const SaveFailureRecovery: Story = {
  args: { scenario: "save-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Log time" }));
    await userEvent.type(await body.findByLabelText("Duration"), "45m");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await body.findByRole("alert");
    await expect(body.getByLabelText("Duration")).toHaveValue("45m");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const LogTimeInSpaceTask: Story = {
  args: { initialView: "space-task", scenario: "empty" },
  parameters: { reactRouter: { path: "/spaces/product/kanban", routePath: "*" } },
  play: async ({ canvasElement }) => {
    const canvas: HTMLElement = canvasElement;
    const document = canvas.ownerDocument;
    const body = within(document.body);
    const card = canvas.querySelector<HTMLElement>('[data-test-id="kanban-card-title-task-research"]');
    if (!card) throw new Error("Space task card is missing");
    await userEvent.click(card);
    const slideIn = await body.findByRole("dialog");
    await expect(slideIn).toHaveAttribute("data-test-id", "task-slide-in");
    await userEvent.click(within(slideIn).getByRole("button", { name: "Log time" }));
    await userEvent.type(await body.findByLabelText("Duration"), "45m");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(body.queryByLabelText("Duration")).not.toBeInTheDocument());
    await expect(slideIn.querySelector('[data-test-id="task-own-time"]')).not.toHaveTextContent(/^0/);
    await userEvent.click(within(slideIn).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.querySelector('[data-test-id="space-kanban-page-product"]')).toBeVisible();
    await userEvent.click(card);
    const reopened = await body.findByRole("dialog");
    await expect(reopened.querySelector('[data-test-id="task-own-time"]')).not.toHaveTextContent(/^0/);
  },
};

export const ProjectOverviewWorkflow: Story = {
  args: { initialView: "project", scenario: "empty" },
  parameters: { reactRouter: { path: "/projects/launch?tab=overview", routePath: "*" } },
  play: async ({ canvasElement }) => {
    const canvas: HTMLElement = canvasElement;
    const body = within(canvas.ownerDocument.body);
    const section = canvas.querySelector<HTMLElement>('[data-test-id="project-time-section"]');
    if (!section) throw new Error("Project time section is missing");
    await expect(canvas.querySelector('[data-test-id="tab-time"]')).not.toBeInTheDocument();
    await userEvent.click(within(section).getByRole("button", { name: "Log time" }));
    await userEvent.type(await body.findByLabelText("Duration"), "45m");
    await userEvent.click(body.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(within(section).getByText("General project work")).toBeVisible();
    const total = section.querySelector('[data-test-id="project-time-total"]');
    await expect(total).toHaveTextContent("45m");
    const settings = canvas.querySelector<HTMLElement>('[data-test-id="time-tracking-settings"]');
    if (!settings) throw new Error("Project time settings are missing");
    await userEvent.click(settings);
    await userEvent.click(await body.findByRole("switch", { name: "Enable time tracking" }));
    await waitFor(() => expect(body.getByRole("switch")).not.toBeChecked());
    await userEvent.click(body.getByRole("button", { name: "Done" }));
    await expect(within(section).queryByRole("button", { name: "Log time" })).not.toBeInTheDocument();
    await expect(total).toHaveTextContent("45m");
  },
};

export const DiscardTimer: Story = {
  args: { initialView: "task", scenario: "long-timer" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Timer actions" }));
    await userEvent.click(body.getByRole("menuitem", { name: "Discard" }));
    await userEvent.click(body.getByRole("button", { name: "Keep timer" }));
    await expect(canvas.getByRole("timer")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Timer actions" }));
    await userEvent.click(body.getByRole("menuitem", { name: "Discard" }));
    await userEvent.click(body.getByRole("button", { name: "Discard time" }));
    await waitFor(() => expect(canvas.queryByRole("timer")).not.toBeInTheDocument());
  },
};
