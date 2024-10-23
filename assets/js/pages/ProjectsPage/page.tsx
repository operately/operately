import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useFilters } from "./loader";
import { PrimaryButton } from "@/components/Buttons";
import { ProjectList } from "@/features/ProjectList";

import classNames from "classnames";
import { Paths } from "@/routes/paths";

export function Page() {
  const { projects } = useLoadedData();

  return (
    <Pages.Page title="Projects">
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <Title />

          <Filters />
          <ProjectList projects={projects} showSpace />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { company } = useLoadedData();

  return (
    <div className="flex items-center justify-between pb-6 mb-6 border-b border-stroke-base">
      <h1 className="text-3xl font-bold text-center leading-none">Projects in {company.name}</h1>

      <PrimaryButton size="sm" linkTo={Paths.newProjectPath()}>
        Add Project
      </PrimaryButton>
    </div>
  );
}

function Filters() {
  const { activeFilter } = useLoadedData();
  const { setFilter } = useFilters();

  return (
    <div className="flex items-center justify-center mb-6 gap-2">
      <div className="border border-stroke-base shadow text-sm font-medium rounded-full flex items-center bg-dark-8">
        <FilterButton onClick={() => setFilter("my-projects")} active={activeFilter === "my-projects"}>
          My Projects
        </FilterButton>
        <FilterButton onClick={() => setFilter("reviewed-by-me")} active={activeFilter === "reviewed-by-me"}>
          Reviewed by Me
        </FilterButton>
        <FilterButton onClick={() => setFilter("all-projects")} active={activeFilter === "all-projects"}>
          All Projects
        </FilterButton>
      </div>
    </div>
  );
}

function FilterButton({ onClick, children, active }) {
  const className = classNames(
    "px-3 py-1 text-sm font-medium rounded-full",
    active ? "bg-surface-base cursor-pointer" : "bg-transparent cursor-pointer text-white-1",
  );

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
