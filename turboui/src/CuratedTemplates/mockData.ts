import type { CuratedTemplate, TemplateType } from "./types";

export function templateFixture(type: TemplateType = "project"): CuratedTemplate {
  const definitions = {
    kpi: { name: "Monthly revenue", unit: "USD", cadence: "monthly" },
    goal: {
      name: "Improve retention",
      duration_days: 90,
      targets: [{ name: "Reduce churn", unit: "%", from: 10, to: 5 }],
    },
    project: {
      name: "Customer onboarding",
      duration_days: 30,
      milestones: [{ key: "launch", title: "Launch", due_offset_days: 30 }],
      tasks: [{ key: "guide", name: "Write the welcome guide", milestone_key: "launch", due_offset_days: 7 }],
    },
  };
  return {
    id: `template-${type}`,
    title: definitions[type].name,
    type,
    state: "draft",
    contentLanguage: "en",
    definition: JSON.stringify(definitions[type]),
    insertedAt: "2026-10-01T12:00:00.000000Z",
    updatedAt: "2026-10-01T12:00:00.000000Z",
  };
}
