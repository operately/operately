import * as React from "react";

import { BlackLink } from "@/components/Link";
import { WarningCallout } from "@/components/Callouts";
import { ActiveSubitem, useLoadedData } from "./loader";

import plurarize from "@/utils/plurarize";

export function ActiveSubitemsWarning() {
  const { activeSubitems } = useLoadedData();

  if (activeSubitems.length === 0) return null;

  return (
    <div className="mb-6">
      <WarningCallout
        message={warningTitle(activeSubitems)}
        description={<ActiveItemLinkList items={activeSubitems} />}
      />
    </div>
  );
}

function ActiveItemLinkList({ items }: { items: ActiveSubitem[] }) {
  return (
    <ul className="flex flex-col gap-1 mt-2">
      {items.map((item) => (
        <li key={item.id}>
          <BlackLink to={item.link} target="_blank" className="hover:text-content-error">
            {item.name}
          </BlackLink>
        </li>
      ))}
    </ul>
  );
}

function warningTitle(activeSubitems: ActiveSubitem[]): string {
  let title = "This goal contains ";

  const activeSubgoals = activeSubitems.filter((item) => item.type === "goal");
  const activeProjects = activeSubitems.filter((item) => item.type === "project");

  if (activeSubgoals.length > 0) {
    title += plurarize(activeSubgoals.length, "sub-goal", "sub-goals");
  }

  if (activeSubgoals.length > 0 && activeProjects.length > 0) {
    title += " and ";
  }

  if (activeProjects.length > 0) {
    title += plurarize(activeProjects.length, "project", "projects");
  }

  title += " that will remain active: ";

  return title;
}
