import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useFilters } from "./loader";
import { FilledButton } from "@/components/Button";
import { ProjectList } from "@/features/ProjectList";

import classNames from "classnames";
import { Paths } from "@/routes/paths";

export function Page() {
  const { projects } = useLoadedData();

  return (
    <Pages.Page title={"Projects"}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <Filters />
          <Title />

          <div className="flex items-center justify-center mb-10 gap-4">
            <FilledButton linkTo={Paths.newProjectPath()}>Add Project</FilledButton>
          </div>

          <ProjectList projects={projects} showSpace />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { company, activeFilter } = useLoadedData();

  switch (activeFilter) {
    case "my-projects":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">My projects in {company.name}</h1>;
    case "reviewed-by-me":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">Reviewed by me in {company.name}</h1>;
    case "all-projects":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">All projects in {company.name}</h1>;
  }
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
    active ? "bg-surface cursor-pointer" : "bg-transparent cursor-pointer text-white-1",
  );

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
