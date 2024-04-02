import * as React from "react";

import Avatar from "@/components/Avatar";
import { Person } from "@/models/people";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import classNames from "classnames";

interface PageHeaderProps {
  person: Person;
  activeTab: "about" | "activity";
}

export function PageHeader(props: PageHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar person={props.person} size={72} />
        <div className="flex flex-col">
          <div className="text-xl font-bold">{props.person.fullName}</div>
          <div className="font-medium">{props.person.title}</div>
        </div>
      </div>

      <Tabs {...props} />
    </div>
  );
}

function Tabs(props: PageHeaderProps) {
  return (
    <div className="flex gap-2 border-b border-surface-outline mt-6 -mx-12 px-12">
      <Tab title="About" linkTo={Paths.profilePath(props.person.id)} isActive={props.activeTab === "about"} />
      <Tab
        title="Activity"
        linkTo={Paths.profileActivityPath(props.person.id)}
        isActive={props.activeTab === "activity"}
      />
    </div>
  );
}

function Tab({ title, linkTo, isActive }) {
  const className = classNames("border-surface-outline rounded-t px-4 py-1 -mb-px cursor-pointer bg-surface", {
    "border-x border-t font-medium": isActive,
    border: !isActive,
    "hover:text-content": !isActive,
  });

  return (
    <DivLink to={linkTo} className={className}>
      {title}
    </DivLink>
  );
}
