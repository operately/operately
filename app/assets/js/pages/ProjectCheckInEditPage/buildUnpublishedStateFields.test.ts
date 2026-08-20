import { buildUnpublishedStateFields } from "./buildUnpublishedStateFields";
import type { ProjectCheckInFormPage } from "turboui";

function editMeta(
  action: ProjectCheckInFormPage.EditAction,
  scheduledAt: string | null = null,
): ProjectCheckInFormPage.EditSubmitMeta {
  return { mode: "edit", action, scheduledAt };
}

describe("buildUnpublishedStateFields", () => {
  const existingScheduledAt = "2026-08-21T15:00:00.000Z";

  it("returns an empty object when the check-in is already published", () => {
    expect(buildUnpublishedStateFields(false, editMeta("publish"), existingScheduledAt)).toEqual({});
  });

  it("returns an empty object for create-mode meta", () => {
    const createMeta: ProjectCheckInFormPage.CreateSubmitMeta = {
      mode: "create",
      action: "submit",
      scheduledAt: null,
    };

    expect(buildUnpublishedStateFields(true, createMeta, existingScheduledAt)).toEqual({});
  });

  it("publishes immediately and clears the schedule", () => {
    expect(buildUnpublishedStateFields(true, editMeta("publish-now"), existingScheduledAt)).toEqual({
      state: "published",
      scheduledAt: null,
    });
  });

  it("saves as draft and clears the schedule", () => {
    expect(buildUnpublishedStateFields(true, editMeta("save-as-draft"), existingScheduledAt)).toEqual({
      state: "draft",
      scheduledAt: null,
    });
  });

  it("keeps a scheduled check-in scheduled when saving changes", () => {
    expect(buildUnpublishedStateFields(true, editMeta("save-changes"), existingScheduledAt)).toEqual({
      state: "scheduled",
      scheduledAt: existingScheduledAt,
    });
  });

  it("prefers the meta schedule when saving changes", () => {
    const nextScheduledAt = "2026-08-22T09:00:00.000Z";

    expect(buildUnpublishedStateFields(true, editMeta("save-changes", nextScheduledAt), existingScheduledAt)).toEqual({
      state: "scheduled",
      scheduledAt: nextScheduledAt,
    });
  });

  it("schedules when the action is schedule", () => {
    const scheduledAt = "2026-08-22T09:00:00.000Z";

    expect(buildUnpublishedStateFields(true, editMeta("schedule", scheduledAt), null)).toEqual({
      state: "scheduled",
      scheduledAt,
    });
  });

  it("schedules when publishing with a local schedule selected", () => {
    const scheduledAt = "2026-08-22T09:00:00.000Z";

    expect(buildUnpublishedStateFields(true, editMeta("publish", scheduledAt), null)).toEqual({
      state: "scheduled",
      scheduledAt,
    });
  });

  it("publishes when the action is publish without a schedule", () => {
    expect(buildUnpublishedStateFields(true, editMeta("publish"), existingScheduledAt)).toEqual({
      state: "published",
    });
  });

  it("saves as draft for the default save action", () => {
    expect(buildUnpublishedStateFields(true, editMeta("save"), existingScheduledAt)).toEqual({
      state: "draft",
      scheduledAt: null,
    });
  });
});
