import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as Forms from "../Forms";
import { ProjectTemplateSelection } from ".";

jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value?: { label: string; value: string };
    onChange: (option: { label: string; value: string } | null) => void;
  }) {
    return (
      <select
        aria-label="Template"
        value={value?.value ?? ""}
        onChange={(event) => onChange(options.find((option) => option.value === event.target.value) ?? null)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

const templates = [
  { id: "marketing", name: "Campaign", spaceId: "space-1" },
  { id: "product", name: "Launch", spaceId: "space-2" },
];

function Harness({ spaceId = "space-1" }: { spaceId?: string }) {
  const form = Forms.useForm({ fields: { template: "", startDate: "" }, submit: async () => undefined });

  return (
    <Forms.Form form={form}>
      <ProjectTemplateSelection spaceId={spaceId} templates={templates} />
      <Forms.Submit />
    </Forms.Form>
  );
}

describe("ProjectTemplateSelection", () => {
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
});

function selectCurrentDate(label: string) {
  const date = new Date();
  const isoDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

  fireEvent.click(screen.getByLabelText(label));

  const day = document.querySelector(`[data-date="${isoDate}"]`);
  if (!day) throw new Error(`Could not find calendar day ${isoDate}`);

  fireEvent.click(day);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}
