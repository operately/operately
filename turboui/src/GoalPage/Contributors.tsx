import React from "react";
import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import { IconInfoCircle } from "../icons";
import { BlackLink, Link } from "../Link";
import { Tooltip } from "../Tooltip";
import { SectionHeader } from "./SectionHeader";

export function Contributors(props: GoalPage.State) {
  if (props.contributors.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionHeader title="Contributors" buttons={<Info />} showButtons={true} />

      <div className="mt-4">
        {props.contributors!.map((c) => (
          <div
            className="border-t last:border-b border-stroke-base py-1.5 text-sm flex items-start gap-2"
            key={c.person.id}
          >
            <div className="flex items-start gap-2 w-40 shrink-0">
              <Avatar person={c.person} size={20} />
              <BlackLink className="font-medium shrink-0 mt-0.5" to={c.personLink} underline="hover">
                {c.person.fullName}
              </BlackLink>
            </div>

            <div className="mt-0.5">
              {c.contributions.map((contribution, index) => (
                <span key={index}>
                  {contribution.role} on{" "}
                  <Link to={contribution.link} underline="hover">
                    {contribution.location}
                  </Link>
                  {index < c.contributions.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info() {
  const tooltip = (
    <div className="max-w-xs">
      <div className="font-bold text-sm">Who is listed as a contributor?</div>
      <div className="mt-2 text-xs">
        Contributors are people who made contributions to this goal by working on subgoals and projects.
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltip}>
      <IconInfoCircle size={16} className="text-content-dimmed hover:text-blue-500" />
    </Tooltip>
  );
}
