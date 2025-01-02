import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Space } from "@/models/spaces";
import { ResourceHub, ResourceHubFolder, ResourceHubLink } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { truncateString } from "@/utils/strings";
import classNames from "classnames";

export function Navigation({ children, testId }: { children: React.ReactNode; testId?: string }) {
  const className = classNames(
    "bg-surface-dimmed",
    "flex items-center flex-wrap",
    "justify-center gap-1",
    "pt-2 pb-1 mx-0 sm:mx-10",
    "font-semibold rounded-t",
    "border-b sm:border-b-0 sm:border-t sm:border-x border-surface-outline",
  );

  return (
    <div className={className} data-test-id={testId}>
      {children}
    </div>
  );
}

interface NavItemProps {
  linkTo: string;
  children: React.ReactNode;
  testId?: string;
}

export function NavItem({ linkTo, children, testId }: NavItemProps) {
  return (
    <Link to={linkTo} testId={testId}>
      <span className="flex items-center gap-1.5">{children}</span>
    </Link>
  );
}

export function NavSeparator() {
  return (
    <div className="shrink-0">
      <Icons.IconSlash size={16} />
    </div>
  );
}

export function NavigateBack({ to, title }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <Link to={to}>
        <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
        {title}
      </Link>
    </div>
  );
}

export function NavSpaceLink({ space }: { space: Space }) {
  return <NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</NavItem>;
}

export function NavResourceHubLink({ resourceHub }: { resourceHub: ResourceHub }) {
  return <NavItem linkTo={Paths.resourceHubPath(resourceHub.id!)}>{resourceHub.name}</NavItem>;
}

export function NavFolderLink({ folder }: { folder: ResourceHubFolder }) {
  return <NavItem linkTo={Paths.resourceHubFolderPath(folder.id!)}>{truncateString(folder.name!, 20)}</NavItem>;
}

export function NavLinkLink({ link }: { link: ResourceHubLink }) {
  return <NavItem linkTo={Paths.resourceHubLinkPath(link.id!)}>{link.name!}</NavItem>;
}
