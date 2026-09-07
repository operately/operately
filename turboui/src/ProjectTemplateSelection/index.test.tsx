import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as Forms from "../Forms";
import { ProjectTemplateFields, ProjectTemplateSelection } from ".";

jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
    classNames,
  }: {
    options: { label: string; value: string; kind?: string }[];
    value?: { label: string; value: string; kind?: string };
    onChange: (option: { label: string; value: string; kind?: string } | null) => void;
    classNames?: {
      option?: (props: { isFocused: boolean; data: { label: string; value: string; kind?: string } }) => string;
    };
  }) {
    return (
      <select
        aria-label="Template"
        value={value?.value ?? ""}
        onChange={(event) => onChange(options.find((option) => option.value === event.target.value) ?? null)}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className={classNames?.option?.({ isFocused: false, data: option })}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

const templates = [
  {
    id: "marketing",
    name: "Campaign",
    spaceId: "space-1",
    inactivePeopleSummary: { personCount: 1, roleCount: 1, taskCount: 3 },
  },
  { id: "discussion-singular", name: "Editorial", spaceId: "space-1", inactiveDiscussionCount: 1 },
  { id: "discussion-plural", name: "Release", spaceId: "space-1", inactiveDiscussionCount: 2 },
  { id: "product", name: "Launch", spaceId: "space-2" },
];

function Harness({
  spaceId = "space-1",
  availableTemplates = templates,
  onCreateTemplate,
}: {
  spaceId?: string;
  availableTemplates?: typeof templates;
  onCreateTemplate?: () => void;
}) {
  const form = Forms.useForm({ fields: { template: "", startDate: "" }, submit: async () => undefined });

  return (
    <Forms.Form form={form}>
      <ProjectTemplateSelection spaceId={spaceId} templates={availableTemplates} onCreateTemplate={onCreateTemplate} />
      <Forms.Submit />
    </Forms.Form>
  );
}

function ControlledHarness({ spaceId = "space-1" }: { spaceId?: string }) {
  const [templateId, setTemplateId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [startDateError, setStartDateError] = React.useState<string | undefined>();

  return (
    <div>
      <ProjectTemplateFields
        spaceId={spaceId}
        templates={templates}
        templateId={templateId}
        onTemplateIdChange={setTemplateId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        startDateError={startDateError}
      />
      <button
        type="button"
        onClick={() => {
          if (templateId && !startDate) {
            setStartDateError("Select a project start date.");
          } else {
            setStartDateError(undefined);
          }
        }}
      >
        Save
      </button>
    </div>
  );
}

describe("ProjectTemplateSelection", () => {
  it("keeps template creation as the last option after available templates", () => {
    const onCreateTemplate = jest.fn();
    render(<Harness onCreateTemplate={onCreateTemplate} />);

    const options = screen.getAllByRole("option");
    const createOption = screen.getByRole("option", { name: "Create a project template" });
    const noTemplateOption = screen.getByRole("option", { name: "No template" });

    expect(options[options.length - 1]).toBe(createOption);
    expect(createOption).toHaveClass("border-t", "sticky", "text-link-base");
    expect(noTemplateOption).toHaveClass("text-content-dimmed");
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: createOption.getAttribute("value") } });
    expect(onCreateTemplate).toHaveBeenCalledTimes(1);
  });

  it("offers template creation when the selected Space has no templates", () => {
    render(<Harness availableTemplates={[]} onCreateTemplate={jest.fn()} />);

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "No template",
      "Create a project template",
    ]);
  });

  it("shows only templates from the selected Space and requires a date after selection", async () => {
    render(<Harness />);

    expect(screen.getByRole("option", { name: "Campaign" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Launch" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Project start date/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });
    expect(screen.getByLabelText(/Project start date/)).toHaveTextContent("Select a date");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Select a project start date.");
  });

  it("clears a template selection when the Space changes", async () => {
    const { rerender } = render(<Harness />);
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });
    selectCurrentDate("Project start date");

    rerender(<Harness spaceId="space-2" />);
    await waitFor(() => expect(screen.getByLabelText("Template")).toHaveValue(""));
    expect(screen.queryByLabelText(/Project start date/)).not.toBeInTheDocument();
  });

  it("warns about inactive people only for the selected template", () => {
    render(<Harness />);

    expect(screen.queryByText(/no longer active/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });

    expect(screen.getByRole("status")).toHaveTextContent("1 person in this template is no longer active.");
    expect(screen.getByRole("status")).toHaveTextContent("Their project role and 3 tasks will be left unassigned.");
  });

  it("warns only for the selected template when discussion authors are inactive", () => {
    render(<Harness />);

    expect(screen.queryByText(/discussion.*attributed to you/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });
    expect(screen.queryByText(/discussion.*attributed to you/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "discussion-singular" } });
    expect(
      screen.getByText(
        "1 discussion in this template will be attributed to you because its original author is no longer active.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "discussion-plural" } });
    expect(
      screen.getByText(
        "2 discussions in this template will be attributed to you because their original authors are no longer active.",
      ),
    ).toBeInTheDocument();
  });
});

describe("ProjectTemplateFields", () => {
  it("filters by space and validates start date in controlled mode", async () => {
    render(<ControlledHarness />);

    expect(screen.getByRole("option", { name: "Campaign" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Launch" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });
    expect(screen.getByLabelText(/Project start date/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Select a project start date.");
  });

  it("clears selection when space changes in controlled mode", async () => {
    const { rerender } = render(<ControlledHarness />);
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "marketing" } });
    selectCurrentDate("Project start date");

    rerender(<ControlledHarness spaceId="space-2" />);
    await waitFor(() => expect(screen.getByLabelText("Template")).toHaveValue(""));
    expect(screen.queryByLabelText(/Project start date/)).not.toBeInTheDocument();
  });
});

function selectCurrentDate(label: string) {
  const date = new Date();
  const isoDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  fireEvent.click(screen.getByLabelText(label));

  const day = document.querySelector(`[data-date="${isoDate}"]`);
  if (!day) throw new Error(`Could not find calendar day ${isoDate}`);

  fireEvent.click(day);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}
