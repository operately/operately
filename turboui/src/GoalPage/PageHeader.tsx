import { IconChevronRight } from "@tabler/icons-react";
import React from "react";
import { GoalPage } from ".";
import EditableText from "../EditableText";
import { IconGoal } from "../icons";
import { BlackLink } from "../Link";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { StatusBadge } from "../StatusBadge";

export function PageHeader(props: GoalPage.State) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
  ];

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconGoal size={38} className="rounded-lg bg-red-50 dark:bg-red-900" />

      <div>
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <EditableText
            className="font-semibold text-lg"
            text={props.goalName}
            onSave={props.updateGoalName}
            readonly={!props.canEdit}
            trimBeforeSave
          />

          <PrivacyIndicator
            resourceType="goal"
            privacyLevel={props.privacyLevel}
            spaceName={props.spaceName}
            className="inline-block ml-3 align-[-2px]"
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
