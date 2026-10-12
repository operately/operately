import { templateFixture } from "../mockData";
import { buildPreview, getTemplatePreviewReferenceDate } from "./adapters";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { sortTasks } from "../../TaskBoard/utils/sortTasks";
import { compareIds } from "../../utils/ids";

const labels = { missing: "Not set", pending: "Pending" };
const options = { referenceDate: "2026-10-12", formattedTimePreferences: defaultFormattedTimePreferences, labels };

test("project preview keys with shared suffixes retain distinct tasks and milestones", () => {
  const template = templateFixture("project");
  template.definition = JSON.stringify({
    name: template.title,
    milestones: [
      { key: "design-review", title: "Design" },
      { key: "security-review", title: "Security" },
    ],
    tasks: [
      { key: "design-review", name: "Design review", milestone_key: "design-review" },
      { key: "security-review", name: "Security review", milestone_key: "design-review" },
      { key: "security%2Dreview", name: "Final review", milestone_key: "security-review" },
    ],
  });
  const preview = buildPreview(template, options);
  if (preview.type !== "project") throw new Error("Expected project");
  const { tasks, milestones, kanbanState, getTaskPageProps } = preview.props;
  const [design, security] = milestones;
  if (!design || !security) throw new Error("Expected two milestones");

  expect(compareIds(design.id, security.id)).toBe(false);
  expect(
    sortTasks(
      tasks.filter((task) => task.milestone?.id === design.id),
      design,
    ).map((task) => task.title),
  ).toEqual(["Design review", "Security review"]);
  expect(tasks[2]?.milestone?.id).toBe(security.id);
  expect(kanbanState.pending).toEqual(tasks.map((task) => task.id));
  tasks.forEach((task) => {
    expect(tasks.filter((other) => compareIds(task.id, other.id))).toHaveLength(1);
    expect(getTaskPageProps(task.id, { tasks, statuses: preview.props.statuses })?.name).toBe(task.title);
  });
});

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
