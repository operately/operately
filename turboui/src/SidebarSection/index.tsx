import React from "react";
import classNames from "../utils/classnames";
import { NotificationToggle } from "../NotificationToggle";

export function SidebarSection({
  title,
  children,
  testId,
  className = "",
}: {
  title: string | React.ReactNode;
  children: React.ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div className={classNames("space-y-1 sm:space-y-2", className)} data-test-id={testId}>
      <div className="font-medium text-xs sm:font-semibold sm:text-sm">
        <div className="truncate">{title}</div>
      </div>
      {children}
    </div>
  );
}

export function SidebarNotificationSection(props: SidebarNotificationSection.Props) {
  if (props.hidden) return null;

  return (
    <div className={props.className}>
      <SidebarSection title="Notifications">
        <NotificationToggle {...props} />
      </SidebarSection>
    </div>
  );
}

export namespace SidebarNotificationSection {
  export interface Props extends NotificationToggle.Props {
    hidden: boolean;
    className?: string;
  }
}
