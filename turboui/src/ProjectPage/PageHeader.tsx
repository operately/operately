import { IconChevronRight } from "@tabler/icons-react";
import React from "react";
import { ProjectPage } from ".";
import EditableText from "../EditableText";
import { IconProject } from "../icons";
import { BlackLink } from "../Link";
import { StatusBadge } from "../StatusBadge";

export function PageHeader(props: ProjectPage.State) {
  const navigation = [
    { to: props.space.link, label: props.space.name },
    { to: "#", label: "Projects" },
  ];

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconProject size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900" />

      <div>
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <EditableText
            className="font-semibold text-lg"
            text={props.projectName}
            onSave={props.updateProjectName}
            readonly={!props.canEdit}
            trimBeforeSave
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