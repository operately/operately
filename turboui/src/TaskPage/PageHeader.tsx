import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";
import { TextField } from "../TextField";
import { IconChevronRight, IconListCheck } from "../icons";
import { BlackLink } from "../Link";

export function PageHeader(props: TaskPage.State) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Projects" },
    { to: props.projectLink, label: props.projectName },
  ];

  if (props.milestoneName && props.milestoneLink) {
    navigation.push({ to: props.milestoneLink, label: props.milestoneName });
  }

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconListCheck size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900" />

      <div>
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <TextField
            className="font-semibold text-lg"
            text={props.name}
            onChange={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
          />

          <StatusSelector
            status={props.status}
            onChange={props.onStatusChange}
            size="sm"
            readonly={!props.canEdit}
            showFullBadge={true}
          />
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
