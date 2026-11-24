/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { AccessLevels, Goal, ProjectTemplate, Space } from "@/api";
import { useLoadedData } from "./loader";
import { Page } from "./page";

const mockNavigate = jest.fn();
const mockCreate = jest.fn();
const mockCreateFromTemplate = jest.fn();
let mockForm: {
  values: Record<string, any>;
  errors: Record<string, string>;
  actions: { submit: () => Promise<void>; setValue: (field: string, value: unknown) => void };
};

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(window.location.search)],
}));
jest.mock("@/routes/paths", () => ({
  compareIds: jest.requireActual("@/routes/paths").compareIds,
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
    newProjectTemplatePath: (id: string) => `/templates/new/${id}`,
  }),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person-1" }) }));
jest.mock("@/models/people", () => ({ CompanyWideSearchScope: {}, usePeopleSearch: () => jest.fn() }));
jest.mock("@/models/projects", () => ({
  useCreateProject: () => ({ mutateAsync: mockCreate }),
  useCreateProjectFromTemplate: () => ({ mutateAsync: mockCreateFromTemplate }),
}));
jest.mock("@/components/Pages", () => ({ Page: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Body: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DimmedSection: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  NavigateBack: () => null,
}));
jest.mock("@/features/projects/AccessSelectors", () => ({ AccessSelectors: () => null }));
jest.mock("turboui", () => ({
  Trans: ({ values }: { values: { name: string } }) => <>{values.name}</>,
  AccessLevelSummary: ({ anonymous, company, space }: { anonymous: number; company: number; space: number }) => (
    <div data-test-id="privacy" data-levels={`${anonymous},${company},${space}`} />
  ),
  ProjectTemplateSelection: ({ spaceId }: { spaceId?: string }) => (
    <div
      data-test-id="template-selection"
      data-space-id={spaceId}
      data-template-id={mockForm.values.template}
      data-start-date={mockForm.values.startDate}
    />
  ),
  SecondaryButton: () => null,
  Forms: {
    useForm: jest.requireActual("turboui").Forms.useForm,
    useFieldValue: (field: string) => [
      field.split(".").reduce((value, key) => value?.[key], mockForm.values),
      (value: unknown) => mockForm.actions.setValue(field, value),
    ],
    Form: ({ form, children }: { form: typeof mockForm; children: React.ReactNode }) => {
      mockForm = form;
      return <div>{children}</div>;
    },
    FieldGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TextInput: () => null,
    SelectBox: ({ options }: { options: { value: string; label: string }[] }) => (
      <div data-test-id="space-select" data-selected={mockForm.values.space ?? ""}>
        {options.map((option) => (
          <button
            key={option.value}
            data-test-id={`space-option-${option.value}`}
            onClick={() => mockForm.actions.setValue("space", option.value)}
          >
            {option.label}
          </button>
        ))}
        {mockForm.errors.space && <span data-test-id="space-error" />}
      </div>
    ),
    SelectGoal: () => <div data-test-id="goal" data-goal-id={mockForm.values.goal?.id} />,
    SelectPerson: () => null,
    FormError: ({ message }: { message?: string }) => (message ? <div data-test-id="form-error" /> : null),
    Submit: () => <button data-test-id="submit" onClick={() => void mockForm.actions.submit()} />,
  },
}));

const openAccess: AccessLevels = { __typename: "access_levels", public: 0, company: 40, space: 40 };
const privateAccess: AccessLevels = { __typename: "access_levels", public: 0, company: 0, space: 40 };
const suggested: Space = { __typename: "space", id: "suggested-1", name: "Suggested" };
const eligible: Space = { __typename: "space", id: "eligible-2", name: "Eligible", accessLevels: openAccess };
const confidential: Space = {
  __typename: "space",
  id: "confidential-3",
  name: "Confidential",
  accessLevels: privateAccess,
};
const goal: Goal = { __typename: "goal", id: "goal-1", name: "Goal", status: "on_track" };

function load(spaces: Space[], space: Space | null = suggested, templates: ProjectTemplate[] = []) {
  jest.mocked(useLoadedData).mockReturnValue({
    spaceID: space?.id,
    space: space ?? undefined,
    spaces,
    spaceOptions: spaces.map(({ id, name }) => ({ value: id, label: name })),
    goal,
    goals: [goal],
    templates,
  });
}

async function renderPage() {
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => root.render(<Page />));

  const click = async (testId: string) => {
    const button = container.querySelector<HTMLButtonElement>(`[data-test-id="${testId}"]`);
    expect(button).not.toBeNull();
    await act(async () => button?.click());
  };

  return { container, click, unmount: async () => act(async () => root.unmount()) };
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  window.history.replaceState({}, "", "/projects/new");
  mockCreate.mockResolvedValue({ project: { id: "project-1" } });
  mockCreateFromTemplate.mockResolvedValue({ project: { id: "project-1" } });
});

it("keeps the goal and requires an eligible space when the suggested space is unavailable", async () => {
  load([eligible]);
  const page = await renderPage();
  try {
    expect(page.container.querySelector("h1")?.textContent).not.toContain(suggested.name);
    expect(page.container.querySelector('[data-test-id="space-select"]')?.getAttribute("data-selected")).toBe("");
    expect(page.container.querySelector('[data-test-id="goal"]')?.getAttribute("data-goal-id")).toBe(goal.id);
    await page.click("submit");
    expect(page.container.querySelector('[data-test-id="space-error"]')).not.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateFromTemplate).not.toHaveBeenCalled();

    await page.click("space-option-eligible-2");
    await page.click("submit");
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ spaceId: eligible.id, goalId: goal.id }));
  } finally {
    await page.unmount();
  }
});

it("does not create a project when no space is eligible", async () => {
  load([]);
  const page = await renderPage();
  try {
    await page.click("submit");
    expect(page.container.querySelector('[data-test-id="space-error"]')).not.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateFromTemplate).not.toHaveBeenCalled();
  } finally {
    await page.unmount();
  }
});

it("keeps the required-space validation when there is no suggested space", async () => {
  load([eligible], null);
  const page = await renderPage();
  try {
    expect(page.container.querySelector('[data-test-id="space-select"]')?.getAttribute("data-selected")).toBe("");
    await page.click("submit");
    expect(page.container.querySelector('[data-test-id="space-error"]')).not.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  } finally {
    await page.unmount();
  }
});

it("uses the editable space record for equivalent slugged IDs and privacy defaults", async () => {
  load([eligible], { ...eligible, id: "different-slug-2", accessLevels: undefined });
  const page = await renderPage();
  try {
    expect(page.container.querySelector("h1")?.textContent).toContain(eligible.name);
    expect(page.container.querySelector('[data-test-id="space-select"]')?.getAttribute("data-selected")).toBe(
      eligible.id,
    );
    expect(page.container.querySelector('[data-test-id="privacy"]')?.getAttribute("data-levels")).toBe("0,40,40");
    await page.click("submit");
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ spaceId: eligible.id, goalId: goal.id }));
  } finally {
    await page.unmount();
  }
});

it("blocks creation when the selected editable space has no access data", async () => {
  load([{ ...eligible, accessLevels: undefined }], eligible);
  const page = await renderPage();
  try {
    expect(page.container.querySelector('[data-test-id="space-select"]')?.getAttribute("data-selected")).toBe(
      eligible.id,
    );
    await page.click("submit");
    expect(page.container.querySelector('[data-test-id="form-error"]')).not.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateFromTemplate).not.toHaveBeenCalled();
  } finally {
    await page.unmount();
  }
});

it("rejects a space selection that is no longer in the editable list", async () => {
  load([eligible], eligible);
  const page = await renderPage();
  try {
    await act(async () => mockForm.actions.setValue("space", "removed-9"));
    await page.click("submit");
    expect(page.container.querySelector('[data-test-id="space-error"]')).not.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateFromTemplate).not.toHaveBeenCalled();
  } finally {
    await page.unmount();
  }
});

const template: ProjectTemplate = {
  __typename: "project_template",
  id: "template-1",
  name: "Template",
  space: eligible,
  insertedAt: "2026-11-24T00:00:00Z",
  updatedAt: "2026-11-24T00:00:00Z",
  milestoneCount: 0,
  taskCount: 0,
  inactivePeopleSummary: { personCount: 0, roleCount: 0, taskCount: 0 },
  inactiveDiscussionCount: 0,
};

it("creates from a template only in its eligible space and clears it after a space change", async () => {
  window.history.replaceState({}, "", "/projects/new?templateId=template-1");
  load([eligible, confidential], eligible, [template]);
  const page = await renderPage();
  try {
    expect(page.container.querySelector('[data-test-id="template-selection"]')?.getAttribute("data-template-id")).toBe(
      template.id,
    );
    await page.click("submit");
    expect(mockCreateFromTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: eligible.id, goalId: goal.id, templateId: template.id }),
    );

    await act(async () => mockForm.actions.setValue("startDate", "2026-11-30"));
    await page.click("space-option-confidential-3");
    expect(page.container.querySelector('[data-test-id="template-selection"]')?.getAttribute("data-template-id")).toBe(
      "",
    );
    expect(page.container.querySelector('[data-test-id="template-selection"]')?.getAttribute("data-start-date")).toBe(
      "",
    );
    await page.click("submit");
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ spaceId: confidential.id, goalId: goal.id }));
    expect(mockCreateFromTemplate).toHaveBeenCalledTimes(1);
  } finally {
    await page.unmount();
  }
});

it("resets privacy when the user switches to a confidential space", async () => {
  load([eligible, confidential], eligible);
  const page = await renderPage();
  try {
    await page.click("space-option-confidential-3");
    expect(page.container.querySelector('[data-test-id="privacy"]')?.getAttribute("data-levels")).toBe("0,0,40");
    await page.click("submit");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: confidential.id, companyAccessLevel: 0 }),
    );
  } finally {
    await page.unmount();
  }
});
