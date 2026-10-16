import { templateFixture } from "../mockData";
import { buildPreview, getTemplatePreviewReferenceDate } from "./adapters";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { sortTasks } from "../../TaskBoard/utils/sortTasks";
import { compareIds } from "../../utils/ids";

const labels = { missing: "Not set", pending: "Pending" };
const options = { referenceDate: "2026-10-12", formattedTimePreferences: defaultFormattedTimePreferences, labels };

test.each(["goal", "project", "kpi"] as const)("%s previews show consistent example owners", (type) => {
  const template = templateFixture(type);
  const original = JSON.stringify(template);
  const preview = buildPreview(template, options);
  const personFields = preview.type === "kpi" ? preview.kpi : preview.props;
  const examplePerson = {
    id: expect.stringMatching(/\S/),
    fullName: expect.stringMatching(/\S/),
    avatarUrl: expect.stringMatching(/^https:\/\//),
  };

  expect(personFields.champion).toMatchObject(examplePerson);
  if (preview.type !== "kpi") {
    expect(preview.props.reviewer).toMatchObject(examplePerson);
    expect(preview.props.reviewer?.id).not.toBe(preview.props.champion?.id);
  }

  const rebuilt = buildPreview(template, options);
  const rebuiltPersonFields = rebuilt.type === "kpi" ? rebuilt.kpi : rebuilt.props;
  expect(rebuiltPersonFields.champion).toEqual(personFields.champion);
  if (preview.type !== "kpi" && rebuilt.type !== "kpi") {
    expect(rebuilt.props.reviewer).toEqual(preview.props.reviewer);
  }
  expect(JSON.stringify(template)).toBe(original);
});

test("KPI previews use saved example data in chronological order without mutating the template", () => {
  const template = {
    ...templateFixture("kpi"),
    previewData: JSON.stringify({
      entries: [
        { period_offset: -1, value: 416 },
        { period_offset: -2, value: 345 },
      ],
      annotations: [{ period_offset: -1, title: "Campaign" }],
    }),
  };
  const original = JSON.stringify(template);
  const preview = buildPreview(template, options);
  if (preview.type !== "kpi") throw new Error("Expected KPI");
  expect(preview.kpi.entries.map((entry) => entry.value)).toEqual([345, 416]);
  expect(preview.kpi.latestEntry).toEqual(preview.kpi.entries[1]);
  expect(preview.kpi.entries[0]?.recordedAt.getDate()).toBe(1);
  expect(preview.kpi.annotations[0]?.title).toBe("Campaign");
  expect(JSON.stringify(template)).toBe(original);
});

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

test.each([
  ["monthly", "2032-03-31", "2032-02-01", "2031-12-01"],
  ["monthly", "2031-01-01", "2030-12-01", "2030-10-01"],
  ["weekly", "2031-01-05", "2030-12-23", "2030-12-09"],
])("resolves %s examples against %s", (cadence, referenceDate, latest, annotation) => {
  const template = {
    ...templateFixture("kpi"),
    definition: JSON.stringify({ unit: "%", cadence }),
    previewData: JSON.stringify({
      entries: [
        { period_offset: -1, value: 12 },
        { period_offset: -2, value: 10 },
      ],
      annotations: [{ period_offset: -3, title: "Campaign" }],
    }),
  };
  const preview = buildPreview(template, { ...options, referenceDate });
  if (preview.type !== "kpi") throw new Error("Expected KPI");
  const calendarDate = (date: Date) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join(
      "-",
    );
  const latestEntry = preview.kpi.latestEntry;
  const firstAnnotation = preview.kpi.annotations[0];
  if (!latestEntry || !firstAnnotation) throw new Error("Expected example history and annotation");
  expect(calendarDate(latestEntry.recordedAt)).toBe(latest);
  expect(calendarDate(firstAnnotation.date)).toBe(annotation);
  expect(preview.kpi.entries.map(({ value }) => value)).toEqual([10, 12]);
});
