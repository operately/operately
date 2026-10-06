import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SidebarNotificationSection } from "./index";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

it.each(["project_task", "space_task", "project", "milestone", "kpi"] as const)(
  "translates notification copy for %s and keeps toggle behavior",
  async (entityType) => {
    await i18n.changeLanguage("pt-BR");
    const onToggle = jest.fn();
    const { container, rerender } = render(
      <SidebarNotificationSection hidden={false} entityType={entityType} isSubscribed onToggle={onToggle} />,
    );
    expect(screen.getByText("Notificações")).toBeInTheDocument();
    expect(container).toHaveTextContent("Você está recebendo notificações");
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(false);
    rerender(
      <SidebarNotificationSection hidden={false} entityType={entityType} isSubscribed={false} onToggle={onToggle} />,
    );
    expect(container).toHaveTextContent("Você não está recebendo notificações");
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenLastCalledWith(true);
  },
);

it("supports substituted headings and missing-locale fallback", async () => {
  i18n.addResourceBundle("en", "translation", { Notifications: "Translated heading" }, true, true);
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<SidebarNotificationSection hidden={false} entityType="project" isSubscribed={false} onToggle={jest.fn()} />);
  expect(screen.getByText("Translated heading")).toBeInTheDocument();
  expect(screen.getByText("You're not receiving notifications from this project.")).toBeInTheDocument();
});
