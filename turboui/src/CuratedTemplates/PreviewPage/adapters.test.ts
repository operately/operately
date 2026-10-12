import { templateFixture } from "../mockData";
import { buildPreview, getTemplatePreviewReferenceDate } from "./adapters";
import { defaultFormattedTimePreferences } from "../../FormattedTime";

const labels = { missing: "Not set", pending: "Pending" };
const options = { referenceDate: "2026-10-12", formattedTimePreferences: defaultFormattedTimePreferences, labels };

test("project adapters preserve ordering, references, and calendar-day offsets", () => {
  const preview = buildPreview(templateFixture("project"), options);
  expect(preview.type).toBe("project");
  if (preview.type !== "project") throw new Error("Expected project");
  expect(preview.props.tasks[0]?.milestone?.id).toBe("launch");
  expect(preview.props.tasks[0]?.dueDate?.value).toBe("2026-10-19");
  expect(preview.props.milestones[0]?.dueDate?.value).toBe("2026-11-11");
  expect(preview.props.milestones[0]?.tasksOrderingState).toEqual(["guide"]);
  expect(preview.props.checkIns).toEqual([]);
});

test("goal progress begins at the baseline", () => {
  const preview = buildPreview(templateFixture("goal"), options);
  if (preview.type !== "goal") throw new Error("Expected goal");
  expect(preview.props.targets[0]).toMatchObject({ from: 10, to: 5, value: 10 });
});

test("KPI previews have no fabricated measurements", () => {
  const preview = buildPreview(templateFixture("kpi"), options);
  if (preview.type !== "kpi") throw new Error("Expected KPI");
  expect(preview.kpi.entries).toEqual([]);
  expect(preview.kpi.annotations).toEqual([]);
  expect(preview.kpi.latestEntry).toBeNull();
});

test("incomplete target values are omitted without inventing progress", () => {
  const template = templateFixture("goal");
  template.definition = JSON.stringify({ name: template.title, targets: [{ name: "Missing baseline", to: 10 }] });
  const preview = buildPreview(template, options);
  if (preview.type !== "goal") throw new Error("Expected goal");
  expect(preview.props.targets).toEqual([]);
  expect(preview.incomplete).toBe(true);
});

test("the example start date follows the viewer's timezone", () => {
  expect(getTemplatePreviewReferenceDate(new Date("2026-10-12T01:00:00Z"), "America/Sao_Paulo")).toBe("2026-10-11");
});
