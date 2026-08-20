import React from "react";

import { usePostProjectCheckIn } from "@/models/projectCheckIns";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router";
import { ProjectCheckInFormPage, showErrorToast, SubscribersSelector } from "turboui";

import { useLoadedData } from "./loader";

export function Page() {
  const { project } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = usePostProjectCheckIn();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: project.id! } });

  assertPresent(project.potentialSubscribers, "potentialSubscribers must be present in project");

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    projectName: project.name,
  });

  const previousCheckIn = project.lastCheckIn
    ? { checkIn: project.lastCheckIn, link: paths.projectCheckInPath(project.lastCheckIn.id!) }
    : null;

  const subscriptions = {
    subscribers: subscriptionsState.subscribers,
    selectedSubscribers: subscriptionsState.selectedSubscribers,
    onSelectedSubscribersChange: subscriptionsState.onSelectedSubscribersChange,
    subscriptionType: subscriptionsState.subscriptionType,
    onSubscriptionTypeChange: subscriptionsState.onSubscriptionTypeChange,
    alwaysNotify: subscriptionsState.alwaysNotify,
    allSubscribersLabel: subscriptionsState.allSubscribersLabel,
  } as unknown as SubscribersSelector.Props;

  async function handleSubmit(
    values: ProjectCheckInFormPage.Values,
    meta: ProjectCheckInFormPage.SubmitMeta,
  ): Promise<boolean> {
    if (meta.mode !== "create") return false;
    if (!values.status || !values.description) return false;

    try {
      const res = await post({
        projectId: project.id,
        status: values.status,
        description: JSON.stringify(values.description),
        postAsDraft: meta.action === "draft",
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
        scheduledAt: meta.scheduledAt || undefined,
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
      return true;
    } catch {
      showErrorToast("Check-in not submitted", "Check the form and try again.");
      return false;
    }
  }

  return (
    <ProjectCheckInFormPage
      mode="create"
      pageTitle={["Check-In", project.name!]}
      navigation={buildNavigation(project, paths)}
      cancelLink={paths.projectCheckInsPath(project.id!)}
      richTextHandlers={richTextHandlers}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      formattedTimePreferences={formattedTimePreferences}
      reviewer={project.reviewer}
      previousCheckIn={previousCheckIn}
      subscriptions={subscriptions}
      onSubmit={handleSubmit}
    />
  );
}

function buildNavigation(project: ReturnType<typeof useLoadedData>["project"], paths: ReturnType<typeof usePaths>) {
  const items: { to: string; label: string }[] = [];

  if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
    items.push({ to: paths.spaceWorkMapPath(project.space.id, "projects" as const), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  items.push({ to: paths.projectPath(project.id!), label: project.name! });
  items.push({ to: paths.projectCheckInsPath(project.id!), label: "Check-Ins" });

  return items;
}
