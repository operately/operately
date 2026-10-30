import React from "react";
import { configure, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ActivityResourceList, ActivityResourceEntry } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();
configure({ testIdAttribute: "data-test-id" });

const entries = (count: number): ActivityResourceEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    key: String(index),
    name: `Task ${index} <literal>, & details`,
    path: `/tasks/${index}`,
    details: <span>Change {index}</span>,
  }));

test.each([0, 1, 2, 3])("shows all %i entries without a toggle", (count) => {
  render(
    <MemoryRouter>
      <ActivityResourceList entries={entries(count)} locale="en" />
    </MemoryRouter>,
  );
  expect(screen.queryAllByRole("link")).toHaveLength(count);
  expect(screen.queryByRole("button")).toBeNull();
});

test("bounds thirty resources and their details, expands and collapses with a stable focused toggle", () => {
  render(
    <MemoryRouter>
      <ActivityResourceList entries={entries(30)} locale="en" />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(screen.queryByText("Change 3")).toBeNull();
  const toggle = screen.getByRole("button");
  expect(toggle.textContent).toContain("27");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  toggle.focus();
  fireEvent.click(toggle);
  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
    entries(30).map((entry) => entry.path),
  );
  expect(screen.getByText("Change 29")).toBeTruthy();
  expect(screen.getByRole("button")).toBe(toggle);
  expect(document.activeElement).toBe(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(toggle);
  expect(screen.getAllByRole("link")).toHaveLength(3);
});

test("normalizes duplicate keys while keeping equal literal names and associated details", () => {
  const input = entries(4).map((entry) => ({ ...entry, name: "<deleted> & identical", path: undefined }));
  render(
    <MemoryRouter>
      <ActivityResourceList entries={[...input, { ...input[0]!, details: <span>Later change</span> }]} locale="en" />
    </MemoryRouter>,
  );
  expect(screen.queryAllByRole("link")).toHaveLength(0);
  expect(screen.getAllByTestId("activity-resource-entry")).toHaveLength(3);
  expect(screen.getByRole("button").textContent).toContain("1");
  expect(within(screen.getAllByTestId("activity-resource-entry")[0]!).getByText("Later change")).toBeTruthy();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getAllByTestId("activity-resource-entry")).toHaveLength(4);
});

test("expansion is independent and survives growing entries and language switching", async () => {
  const view = (count: number, locale: string) => (
    <MemoryRouter>
      <ActivityResourceList entries={entries(count)} locale={locale} />
      <ActivityResourceList entries={entries(4)} locale={locale} />
    </MemoryRouter>
  );
  const { rerender } = render(view(4, "en"));
  fireEvent.click(screen.getAllByRole("button")[0]!);
  rerender(view(30, "pt-BR"));
  await React.act(async () => {
    await i18n.changeLanguage("pt-BR");
  });
  expect(screen.getAllByRole("link")).toHaveLength(33);
  expect(screen.getAllByRole("button")[0]?.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getAllByRole("button")[1]?.getAttribute("aria-expanded")).toBe("false");
  expect(screen.getAllByRole("button")[1]?.textContent).toContain("1");
});
