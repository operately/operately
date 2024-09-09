import * as React from "react";
import * as Pages from "@/components/Pages";
import * as ProjectContributors from "@/models/projectContributors";

export interface PageState {
  view: "list" | "add" | "edit";
  contributor: ProjectContributors.ProjectContributor | null;

  goToListView: () => void;
  goToEditView: (contributor: ProjectContributors.ProjectContributor) => void;
  goToAddView: () => void;
}

export function usePageState(): PageState {
  const refresh = Pages.useRefresh();
  const [view, setView] = React.useState<"list" | "add" | "edit">("list");
  const [contributor, setContributor] = React.useState<ProjectContributors.ProjectContributor | null>(null);

  return {
    view,
    contributor,
    goToListView: () => {
      refresh();
      setContributor(null);
      setView("list");
    },
    goToEditView: (contributor) => {
      refresh();
      setContributor(contributor);
      setView("edit");
    },
    goToAddView: () => {
      refresh();
      setContributor(null);
      setView("add");
    },
  };
}
