import { tn } from "@/i18n";
import { useTranslation } from "react-i18next";
import * as React from "react";

import { BlackLink, WarningCallout } from "turboui";
import { ActiveSubitem, useLoadedData } from "./loader";

export function ActiveSubitemsWarning() {
  useTranslation();
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
  const goals = activeSubitems.filter((item) => item.type === "goal").length;
  const projects = activeSubitems.filter((item) => item.type === "project").length;
  if (goals === 0)
    return tn(
      "This goal contains 1 project that will remain active: ",
      "This goal contains {{count}} projects that will remain active: ",
      projects,
    );
  if (projects === 0)
    return tn(
      "This goal contains 1 subgoal that will remain active: ",
      "This goal contains {{count}} subgoals that will remain active: ",
      goals,
    );
  if (goals === 1)
    return tn(
      "This goal contains 1 subgoal and 1 project that will remain active: ",
      "This goal contains 1 subgoal and {{count}} projects that will remain active: ",
      projects,
    );
  return tn(
    "This goal contains {{goals}} subgoals and 1 project that will remain active: ",
    "This goal contains {{goals}} subgoals and {{count}} projects that will remain active: ",
    projects,
    { goals },
  );
}
