import * as React from "react";
import { useTranslation } from "react-i18next";

import { GlobalSearch } from "../GlobalSearch";
import {
  IconBell,
  IconBriefcase,
  IconBuildingEstate,
  IconCircleKey,
  IconCoffee,
  IconDoorExit,
  IconHome2,
  IconMenu2,
  IconSwitch,
  IconUser,
  IconUserCircle,
} from "../icons";
import { DivLink } from "../Link";
import { OperatelyLogo } from "../Logo";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";
import { Bell } from "./Bell";
import { CompanyDropdown } from "./CompanyDropdown";
import { HelpDropdown } from "./HelpDropdown";
import { NewDropdown } from "./NewDropdown";
import { Review } from "./Review";
import {
  CompanyNavigationLinks,
  CompanyNavigationPerson,
  CompanyNavigationProps,
  CompanyNavigationUpdate,
} from "./types";
import { truncateCompanyName } from "./truncateCompanyName";
import { UpdateBadge } from "./UpdateBadge";
import { User } from "./User";

export namespace CompanyNavigation {
  export type Person = CompanyNavigationPerson;
  export type Links = CompanyNavigationLinks;
  export type Props = CompanyNavigationProps;
  export type Update = CompanyNavigationUpdate;
}

export function CompanyNavigation(props: CompanyNavigation.Props) {
  const size = useWindowSizeBreakpoints();

  if (size === "xs") {
    return <MobileNavigation {...props} />;
  }

  return <DesktopNavigation {...props} />;
}

function MobileNavigation({ companyName, links, onLogOut }: CompanyNavigation.Props) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const displayName = truncateCompanyName(companyName);

  return (
    <div className="transition-all z-50 py-2 bg-base border-b border-surface-outline">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={links.home}>
            <OperatelyLogo />
          </DivLink>
          <DivLink
            className="font-bold cursor-pointer"
            to={links.home}
            title={displayName === companyName ? undefined : companyName}
          >
            {displayName}
          </DivLink>
        </div>

        <div className="">
          <IconMenu2 size={24} onClick={() => setOpen(!open)} />
        </div>
      </div>

      {open && (
        <div
          className="flex flex-col bg-base absolute inset-0 top-10 bg-surface-bg border-t border-surface-outline"
          onClick={() => setOpen(false)}
        >
          <MobileSectionLink to={links.home} icon={IconHome2}>
            {t("Home")}
          </MobileSectionLink>

          <MobileSectionLink to={links.workMap} icon={IconBuildingEstate}>
            {t("Company", { context: "navigation" })}
          </MobileSectionLink>

          <MobileSectionLink to={links.profile} icon={IconBriefcase}>
            {t("My work")}
          </MobileSectionLink>

          <MobileSectionLink to={links.review} icon={IconCoffee}>
            {t("Review")}
          </MobileSectionLink>

          <MobileSectionLink to={links.people} icon={IconUserCircle}>
            {t("People")}
          </MobileSectionLink>

          <MobileSectionLink to={links.notifications} icon={IconBell}>
            {t("Notifications")}
          </MobileSectionLink>

          <MobileSectionLink to={links.account} icon={IconUser}>
            {t("Account")}
          </MobileSectionLink>

          <MobileSectionLink to={links.companyAdmin} icon={IconCircleKey}>
            {t("Company Admin")}
          </MobileSectionLink>

          <MobileSectionLink to={links.lobby} icon={IconSwitch}>
            {t("Switch Company")}
          </MobileSectionLink>

          <MobileSectionAction onClick={onLogOut} icon={IconDoorExit}>
            {t("Log Out")}
          </MobileSectionAction>
        </div>
      )}
    </div>
  );
}

function MobileSectionLink({ to, children, icon }: { to: string; children: React.ReactNode; icon: React.ElementType }) {
  return (
    <DivLink
      to={to}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-base px-4 py-2.5 border-b border-surface-outline first:border-t"
    >
      {React.createElement(icon, { size: 16 })}
      {children}
    </DivLink>
  );
}

function MobileSectionAction({
  onClick,
  children,
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div
      onClick={onClick}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-base px-4 py-2.5 border-b border-surface-outline first:border-t"
    >
      {React.createElement(icon, { size: 16 })}
      {children}
    </div>
  );
}

function DesktopNavigation(props: CompanyNavigationProps) {
  const { t } = useTranslation();
  const { companyName, links, canAddGoal, canAddProject, canAddSpace, canInvitePeople } = props;

  return (
    <div className="transition-all z-50 py-1.5 bg-base border-b border-surface-outline">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={links.home}>
            <OperatelyLogo />
          </DivLink>

          {props.showCurrentVersion && <UpdateBadge update={props.availableUpdate} />}

          <div className="border-l border-surface-outline px-2.5 ml-4">
            <CompanyDropdown
              companyName={companyName}
              links={links}
              canViewCompanyDirectory={props.canViewCompanyDirectory}
            />
          </div>

          <div className="flex items-center gap-1 lg:gap-2.5 border-l border-surface-outline px-4">
            <SectionLink to={links.home} icon={IconHome2}>
              {t("Home")}
            </SectionLink>

            <SectionLink to={links.workMap} icon={IconBuildingEstate} testId="company-work-map-link">
              {t("Company", { context: "navigation" })}
            </SectionLink>

            <SectionLink to={links.profile} icon={IconBriefcase}>
              {t("My work")}
            </SectionLink>
          </div>

          <div className="border-l border-surface-outline pl-4">
            <Review path={links.review} count={props.reviewCount} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search {...props} />
          <NewDropdown
            links={links}
            canAddGoal={canAddGoal}
            canAddProject={canAddProject}
            canAddSpace={canAddSpace}
            canInvitePeople={canInvitePeople}
          />
          <HelpDropdown
            contactUsHref={props.contactUsHref}
            discordUrl={props.discordUrl}
            onOpenKeyboardShortcuts={props.onOpenKeyboardShortcuts}
          />
          <Bell path={links.notifications} unreadCount={props.unreadNotificationCount} />
          <User me={props.me} links={links} onLogOut={props.onLogOut} />
        </div>
      </div>
    </div>
  );
}

interface SectionLinkProps {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  testId?: string;
}

function SectionLink({ to, children, icon: Icon, testId }: SectionLinkProps) {
  return (
    <DivLink
      to={to}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-base px-1.5 py-0.5 rounded whitespace-nowrap"
      testId={testId}
    >
      <Icon size={16} />
      {children}
    </DivLink>
  );
}

function Search(props: CompanyNavigationProps) {
  return (
    <div className="hidden lg:block">
      <GlobalSearch
        search={props.search}
        onNavigate={props.onNavigate}
        fullTextSearchPath={props.fullTextSearchPath}
        testId="header-global-search"
      />
    </div>
  );
}
