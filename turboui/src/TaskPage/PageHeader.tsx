import { IconChevronRight } from "@tabler/icons-react";
import React from "react";
import { TaskPage } from ".";
import EditableText from "../EditableText";
import { BlackLink } from "../Link";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";

export function PageHeader(props: TaskPage.State) {
  const navigation = buildNavigation(props);

  return (
    <div className="mt-4 px-4">
      <div className="flex-1">
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <StatusSelector status={props.status} onChange={props.onStatusChange} size="xl" readonly={!props.canEdit} />

          <EditableText
            className="font-semibold text-2xl"
            text={props.name}
            onSave={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
          />
        </div>
      </div>
    </div>
  );
}

function buildNavigation(props: TaskPage.State) {
  const navigation = [{ to: props.spaceLink, label: props.spaceName }];

  // Add project if available
  if (props.projectLink && props.projectName) {
    navigation.push({ to: props.projectLink, label: props.projectName });
  }

  // Add milestone if available
  if (props.milestoneLink && props.milestoneName) {
    navigation.push({ to: props.milestoneLink, label: props.milestoneName });
  }

  return navigation;
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
