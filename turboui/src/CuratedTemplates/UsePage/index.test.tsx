import React from "react";
import { MemoryRouter } from "react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CuratedTemplateCompanyPicker, CuratedTemplateUsePage, CuratedTemplateUsePageProps } from ".";

test("company selection links to the template in the selected company", () => {
  const companies = [
    { id: "one", name: "First company" },
    { id: "two", name: "Second company" },
  ];
  const { container } = render(
    <MemoryRouter>
      <CuratedTemplateCompanyPicker
        title="Launch template"
        companies={companies}
        companyPath={(id) => `/${id}/templates/launch/use`}
      />
    </MemoryRouter>,
  );

  expect(container.querySelector('[data-test-id="template-company-picker"]')).toBeInTheDocument();
  expect(screen.getByText("Launch template")).toBeInTheDocument();
  for (const company of companies) {
    expect(screen.getByRole("link", { name: company.name })).toHaveAttribute(
      "href",
      `/${company.id}/templates/launch/use`,
    );
  }
});

const defaults: CuratedTemplateUsePageProps = {
  template: { title: "Launch template", summary: "A launch plan", type: "project" },
  spaces: [{ id: "general", name: "General" }],
  defaultSpaceId: "general",
  today: "2026-10-12",
  people: [{ id: "alex", fullName: "Alex", avatarUrl: null }],
  peopleSpaceId: "general",
  onSpaceChange: jest.fn(),
  onCreate: jest.fn(),
  onCancel: jest.fn(),
  homePath: "/company",
};

function field(container: HTMLElement, name: string) {
  const element = container.querySelector(`[data-test-id="${name}"]`);
  if (!element) throw new Error(`Missing field ${name}`);
  return element;
}

test.each(["goal", "project", "kpi"] as const)("shows settings for %s without creating on mount", (type) => {
  const onCreate = jest.fn();
  const { container } = render(
    <CuratedTemplateUsePage {...defaults} template={{ ...defaults.template, type }} onCreate={onCreate} />,
  );
  expect(container.querySelector('[data-test-id="startdate"]') !== null).toBe(type !== "kpi");
  expect(container.querySelector('[data-test-id="reviewerid"]') !== null).toBe(type !== "kpi");
  expect(field(container, "spaceid")).toHaveTextContent("General");
  expect(onCreate).not.toHaveBeenCalled();
});

test("submits defaults, retains settings after failure, and cancels", async () => {
  const onCreate = jest.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValueOnce(undefined);
  const onCancel = jest.fn();
  const { container } = render(<CuratedTemplateUsePage {...defaults} onCreate={onCreate} onCancel={onCancel} />);
  fireEvent.click(field(container, "submit"));
  await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
  expect(onCreate).toHaveBeenLastCalledWith({
    spaceId: "general",
    championId: null,
    reviewerId: null,
    startDate: "2026-10-12",
  });
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  fireEvent.click(field(container, "submit"));
  await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(2));
  expect(onCreate.mock.calls[0]).toEqual(onCreate.mock.calls[1]);
  fireEvent.click(field(container, "cancel"));
  await waitFor(() => expect(onCancel).toHaveBeenCalled());
});

test("disables Create while a submission is pending", async () => {
  let complete = () => {};
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const onCreate = jest.fn(() => pending);
  const { container } = render(<CuratedTemplateUsePage {...defaults} onCreate={onCreate} />);
  const submit = field(container, "submit");

  fireEvent.click(submit);
  await waitFor(() => expect(submit).toBeDisabled());
  fireEvent.click(submit);
  expect(onCreate).toHaveBeenCalledTimes(1);

  await act(async () => complete());
  await waitFor(() => expect(submit).toBeEnabled());
});

test("no writable spaces provides a way home and no Create button", () => {
  const { container } = render(
    <MemoryRouter>
      <CuratedTemplateUsePage {...defaults} spaces={[]} />
    </MemoryRouter>,
  );
  expect(container.querySelector('[data-test-id="no-writable-spaces"]')).toBeInTheDocument();
  expect(container.querySelector('[data-test-id="submit"]')).toBeNull();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/company");
});

test.each([false, true])("changing destination retains only eligible people (eligible: %s)", async (eligible) => {
  const onCreate = jest.fn();
  const props = { ...defaults, spaces: [...defaults.spaces, { id: "private", name: "Private" }], onCreate };
  const { container, rerender } = render(<CuratedTemplateUsePage {...props} />);
  const championInput = field(container, "championid").querySelector("input");
  if (!championInput) throw new Error("Missing person input");
  fireEvent.focus(championInput);
  fireEvent.change(championInput, { target: { value: "Alex" } });
  fireEvent.click(await screen.findByText("Alex"));
  const spaceInput = field(container, "spaceid").querySelector("input");
  if (!spaceInput) throw new Error("Missing space input");
  fireEvent.keyDown(spaceInput, { key: "ArrowDown" });
  fireEvent.click(await screen.findByText("Private"));
  rerender(<CuratedTemplateUsePage {...props} peopleSpaceId="private" people={eligible ? defaults.people : []} />);
  fireEvent.click(field(container, "submit"));
  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: "private", championId: eligible ? "alex" : null }),
    ),
  );
});
