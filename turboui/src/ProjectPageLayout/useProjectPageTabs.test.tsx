import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { Tabs } from "../Tabs";
import { useProjectPageTabs } from "./useProjectPageTabs";

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconClipboardText: HiddenIcon,
    IconListCheck: HiddenIcon,
    IconLogs: HiddenIcon,
    IconMessage: HiddenIcon,
    IconMessages: HiddenIcon,
  };
});

const childrenCount = {
  tasksCount: 4,
  discussionsCount: 2,
  checkInsCount: 1,
};

function ProjectTabs() {
  const tabs = useProjectPageTabs({
    defaultTab: "overview",
    childrenCount,
    showDocsAndFiles: true,
  });

  return <Tabs tabs={tabs} />;
}

function HiddenDocsTabs() {
  const tabs = useProjectPageTabs({
    defaultTab: "overview",
    childrenCount,
    showDocsAndFiles: false,
  });

  return <Tabs tabs={tabs} />;
}

function ChildPageTabs() {
  const tabs = useProjectPageTabs({
    defaultTab: "overview",
    childrenCount,
    showDocsAndFiles: true,
    urlPath: "/projects/project-1",
  });

  return <Tabs tabs={tabs} />;
}

describe("useProjectPageTabs", () => {
  test("includes the docs and files tab when showDocsAndFiles is true", () => {
    render(
      <MemoryRouter initialEntries={["/projects/project-1"]}>
        <ProjectTabs />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Docs & Files" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Activity" })).toBeInTheDocument();
  });

  test("hides the docs and files tab when showDocsAndFiles is false", () => {
    render(
      <MemoryRouter initialEntries={["/projects/project-1"]}>
        <HiddenDocsTabs />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Docs & Files" })).not.toBeInTheDocument();
  });

  test("uses urlPath for child pages so docs and files navigates to the project", () => {
    render(
      <MemoryRouter initialEntries={["/milestones/m-1"]}>
        <ChildPageTabs />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Docs & Files" })).toHaveAttribute(
      "href",
      "/projects/project-1?tab=docs-and-files",
    );
  });
});
