import React from "react";
import { IconChevronRight, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { StatusBadge } from "../StatusBadge";
import { TextField } from "../TextField";
import { BadgeStatus } from "../StatusBadge/types";

namespace PageHeader {
  interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Props {
    space: Space;
    workmapLink: string;
    projectName: string;
    canEdit: boolean;
    status: BadgeStatus;
    updateProjectName: (name: string) => Promise<boolean>;
  }
}

export function PageHeader(props: PageHeader.Props) {
  const navigation = [
    { to: props.space.link, label: props.space.name },
    { to: props.workmapLink, label: "Projects" },
  ];

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconProject size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900" />

      <div>
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <TextField
            className="font-semibold text-lg"
            text={props.projectName}
            onChange={props.updateProjectName}
            readonly={!props.canEdit}
            trimBeforeSave
            testId="project-name-field"
          />

          <StatusBadge status={props.status} hideIcon className="scale-90 inline-block shrink-0 align-[5px]" />
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ navigation }: { navigation: { to: string; label: string }[] }) {
  return (
    <div>
      <nav className="flex items-center space-x-0.5 mt-1">
        {navigation.map((item, index) => (
          <React.Fragment key={index}>
            <BlackLink to={item.to} className="text-xs text-content-dimmed leading-snug" underline="hover">
              {item.label}
            </BlackLink>
            {index < navigation.length - 1 && <IconChevronRight size={10} className="text-content-dimmed" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
