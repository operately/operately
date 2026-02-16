import * as Api from "@/api";
import * as React from "react";

import {
  GlobalSearch,
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
} from "turboui";

import { logOut } from "@/routes/auth";
import { Outlet, useNavigate } from "react-router-dom";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink } from "turboui";
import { Bell } from "./Bell";
import { CompanyDropdown } from "./CompanyDropdown";
import { HelpDropdown } from "./HelpDropdown";
import { NewDropdown } from "./NewDropdown";
import { Review } from "./Review";
import { SupportSessionBanner } from "./SupportSessionBanner";
import { User } from "./User";

import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { AiSidebar } from "@/features/AiSidebar";
import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { Paths, usePaths } from "@/routes/paths";
import { useGlobalSearchHandler } from "./useGlobalSearch";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

interface NavigationProps {
  company: Api.Company;
  canAddProject: boolean;
  canAddGoal: boolean;
}

function Navigation(props: NavigationProps) {
  const size = useWindowSizeBreakpoints();

  if (size === "xs") {
    return <MobileNavigation {...props} />;
  } else {
    return <DesktopNavigation {...props} />;
  }
}

function MobileNavigation({ company }: { company: Api.Company }) {
  const me = useMe()!;
  const paths = usePaths();
  const [open, setOpen] = React.useState(false);

  const handleLogOut = async () => {
    const res = await logOut();

    if (res === "success") {
      window.location.href = "/";
    }
  };

  return (
    <div className="transition-all z-50 py-2 bg-base border-b border-surface-outline">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={paths.homePath()}>
            <OperatelyLogo />
          </DivLink>
          <DivLink className="font-bold cursor-pointer" to={paths.homePath()}>
            {company.name}
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
          <MobileSectionLink to={paths.homePath()} icon={IconHome2}>
            Home
          </MobileSectionLink>

          <MobileSectionLink to={paths.workMapPath()} icon={IconBuildingEstate}>
            Company
          </MobileSectionLink>

          <MobileSectionLink to={paths.profilePath(me.id)} icon={IconBriefcase}>
            My work
          </MobileSectionLink>

          <MobileSectionLink to={paths.reviewPath()} icon={IconCoffee}>
            Review
          </MobileSectionLink>

          <MobileSectionLink to={paths.peoplePath()} icon={IconUserCircle}>
            People
          </MobileSectionLink>

          <MobileSectionLink to={paths.notificationsPath()} icon={IconBell}>
            Notifications
          </MobileSectionLink>

          <MobileSectionLink to={paths.accountPath()} icon={IconUser}>
            Account
          </MobileSectionLink>

          <MobileSectionLink to={paths.companyAdminPath()} icon={IconCircleKey}>
            Company Admin
          </MobileSectionLink>

          <MobileSectionLink to={Paths.lobbyPath()} icon={IconSwitch}>
            Switch Company
          </MobileSectionLink>

          <MobileSectionAction onClick={handleLogOut} icon={IconDoorExit}>
            Log Out
          </MobileSectionAction>
        </div>
      )}
    </div>
  );
}

function MobileSectionLink({ to, children, icon }) {
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

function MobileSectionAction({ onClick, children, icon }) {
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

function DesktopNavigation({ company, canAddProject, canAddGoal }: NavigationProps) {
  const me = useMe()!;
  const paths = usePaths();

  return (
    <div className="transition-all z-50 py-1.5 bg-base border-b border-surface-outline">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={paths.homePath()}>
            <OperatelyLogo />
          </DivLink>

          <div className="border-l border-surface-outline px-2.5 ml-4">
            <CompanyDropdown company={company} />
          </div>

          <div className="flex items-center gap-1 lg:gap-2.5 border-l border-surface-outline px-4">
            <SectionLink to={paths.homePath()} icon={IconHome2}>
              Home
            </SectionLink>

            <SectionLink to={paths.workMapPath()} icon={IconBuildingEstate} testId="company-work-map-link">
              Company
            </SectionLink>

            <SectionLink to={paths.profilePath(me.id)} icon={IconBriefcase}>
              My work
            </SectionLink>
          </div>

          <div className="border-l border-surface-outline pl-4">
            <Review />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search />
          <NewDropdown
            canAddGoal={canAddGoal}
            canAddProject={canAddProject}
            canAddSpace={company.permissions?.canCreateSpace || false}
            canInvitePeople={company.permissions?.canInviteMembers || false}
          />
          <HelpDropdown company={company} />
          <Bell />
          <User />
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

export default function CompanyLayout() {
  const data = useCompanyLoaderData();
  const outletDiv = React.useRef<HTMLDivElement>(null);

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex flex-col h-screen">
      <Navigation {...data} />
      <SupportSessionBanner />
      <div className="flex-1 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>

      <DevBar />
      <AiSidebar />
    </div>
  );
}

function Search() {
  const navigate = useNavigate();
  const handleGlobalSearch = useGlobalSearchHandler();

  return (
    <div className="hidden lg:block">
      <GlobalSearch search={handleGlobalSearch} onNavigate={navigate} testId="header-global-search" />
    </div>
  );
}
