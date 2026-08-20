import type { ProjectCheckInFormPage } from "turboui";

export type UnpublishedStateFields = {
  state: "draft" | "scheduled" | "published";
  scheduledAt?: string | null;
};

export function buildUnpublishedStateFields(
  isUnpublished: boolean,
  meta: ProjectCheckInFormPage.SubmitMeta,
  existingScheduledAt: string | null | undefined,
): UnpublishedStateFields | Record<string, never> {
  if (!isUnpublished || meta.mode !== "edit") return {};

  const action = meta.action;

  if (action === "publish-now") {
    return { state: "published", scheduledAt: null };
  }

  if (action === "save-as-draft") {
    return { state: "draft", scheduledAt: null };
  }

  const shouldSchedule =
    action === "schedule" || action === "save-changes" || (action === "publish" && meta.scheduledAt !== null);

  if (shouldSchedule) {
    return {
      state: "scheduled",
      scheduledAt: meta.scheduledAt ?? existingScheduledAt ?? null,
    };
  }

  if (action === "publish") {
    return { state: "published" };
  }

  return { state: "draft", scheduledAt: null };
}
