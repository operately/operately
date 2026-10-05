import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReviewPage, ReviewPageV2 } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

setupTestCatalog();
function assignment(overrides: Partial<ReviewPageV2.Assignment> = {}): ReviewPageV2.Assignment {
  return {
    resourceId: "task",
    name: "Literal <resource> & name",
    due: null,
    type: "project_task",
    role: "owner",
    actionLabel: null,
    path: "/task",
    origin: { id: "project", name: "Literal project", type: "project", path: "/project" },
    taskStatus: "custom_status",
    dueDate: null,
    dueStatus: null,
    dueStatusLabel: null,
    ...overrides,
  };
}
function renderPage(assignments: ReviewPageV2.Assignment[] = [], upcoming = false) {
  const groups = assignments.length ? [{ origin: assignment().origin, assignments }] : [];
  return render(
    <MemoryRouter>
      <ReviewPage
        dueSoon={upcoming ? [] : groups}
        needsReview={[]}
        upcoming={upcoming ? groups : []}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );
}

test("looks up complete review headings and preserves names and links", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      Review: "Translated review",
      "1 outstanding item_one": "Translated one item",
      CONTRIBUTOR: "Translated contributor",
    },
    true,
    true,
  );
  renderPage([assignment()]);
  expect(screen.getByRole("heading", { name: "Translated review" })).toBeInTheDocument();
  expect(screen.getByText("Translated one item")).toBeInTheDocument();
  expect(screen.getByText("Translated contributor")).toBeInTheDocument();
  expect(screen.getByText("Literal <resource> & name").closest("a")).toHaveAttribute("href", "/task");
  expect(screen.getByRole("link", { name: "Literal project" })).toHaveAttribute("href", "/project");
  expect(document.querySelector("resource")).toBeNull();
});

test.each([0, 1, 2])("Portuguese urgent counts: %i", async (count) => {
  await i18n.changeLanguage("pt-BR");
  renderPage(Array.from({ length: count }, (_, i) => assignment({ resourceId: `task-${i}` })));
  expect(
    screen.getByText(count === 0 ? "Tudo em dia" : count === 1 ? "1 item pendente" : "2 itens pendentes"),
  ).toBeInTheDocument();
  expect(document.title).toContain(count === 0 ? "Revisão" : `Revisão (${count})`);
});
test.each([0, 1, 2])("missing Portuguese count translations use English rules: %i", async (count) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  renderPage(Array.from({ length: count }, (_, i) => assignment({ resourceId: `task-${i}` })));
  expect(
    screen.getByText(count === 0 ? "All caught up" : count === 1 ? "1 outstanding item" : "2 outstanding items"),
  ).toBeInTheDocument();
});
test.each([
  ["check_in", "owner", "Submit weekly check-in", "Enviar check-in semanal"],
  ["check_in", "reviewer", "Review weekly check-in", "Revisar check-in semanal"],
  ["goal_update", "owner", "Submit goal progress update", "Enviar atualização de progresso do objetivo"],
  ["goal_update", "reviewer", "Review goal progress update", "Revisar atualização de progresso do objetivo"],
  ["project_retrospective", "reviewer", "Review project retrospective", "Revisar retrospectiva do projeto"],
  ["goal_retrospective", "reviewer", "Review goal retrospective", "Revisar retrospectiva do objetivo"],
  [
    "kpi_update",
    "owner",
    "Log update for Literal <resource> & name",
    "Registrar atualização de Literal <resource> & name",
  ],
] as const)(
  "translates the %s %s action and restores English on switching",
  async (type, role, english, portuguese) => {
    await i18n.changeLanguage("pt-BR");
    const view = renderPage([assignment({ type, role, actionLabel: english })]);
    expect(screen.getByText(portuguese)).toBeInTheDocument();
    expect(screen.getByText(role === "reviewer" ? "REVISOR" : "CHAMPION")).toBeInTheDocument();
    expect(document.querySelector("resource")).toBeNull();
    view.unmount();
    await i18n.changeLanguage("en");
    renderPage([assignment({ type, role, actionLabel: english })]);
    expect(screen.getByText(english)).toBeInTheDocument();
  },
);
test.each(["project_task", "space_task", "milestone"] as const)(
  "keeps %s names literal even when they match a message",
  async (type) => {
    await i18n.changeLanguage("pt-BR");
    renderPage([assignment({ type, actionLabel: "Review weekly check-in" })]);
    expect(screen.getByText("Review weekly check-in")).toBeInTheDocument();
  },
);
test.each([1, 2])("Portuguese overdue counts: %i", async (days) => {
  await i18n.changeLanguage("pt-BR");
  const due = new Date();
  due.setDate(due.getDate() - days);
  due.setHours(12, 0, 0, 0);
  renderPage([assignment({ dueStatus: "overdue", dueDate: due.toISOString() })]);
  expect(screen.getByText(`Data de conclusão atrasada em ${days} ${days === 1 ? "dia" : "dias"}`)).toBeInTheDocument();
});
test.each([1, 2])("missing Portuguese overdue counts fall back: %i", async (days) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  const due = new Date();
  due.setDate(due.getDate() - days);
  due.setHours(12, 0, 0, 0);
  renderPage([assignment({ dueStatus: "overdue", dueDate: due.toISOString() })]);
  expect(screen.getByText(`${days} ${days === 1 ? "day" : "days"} overdue`)).toBeInTheDocument();
});
test.each([
  ["due_today", "hoje"],
  ["due_soon", "amanhã"],
] as const)("uses completion-date terminology for %s", async (dueStatus, label) => {
  await i18n.changeLanguage("pt-BR");
  renderPage([assignment({ dueStatus, dueDate: new Date().toISOString() })]);
  expect(screen.getByText(`Data de conclusão: ${label}`)).toBeInTheDocument();
});
test("upcoming work is excluded from the urgent count", async () => {
  await i18n.changeLanguage("pt-BR");
  renderPage([assignment({ dueStatus: "upcoming" })], true);
  expect(screen.getByText("Tudo em dia")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Meu próximo trabalho" })).toBeInTheDocument();
  expect(
    screen.getByText("Trabalho atribuído a você com datas de conclusão futuras, em ordem cronológica."),
  ).toBeInTheDocument();
});
