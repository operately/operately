import * as Api from "@/api";
import * as React from "react";

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
  GlobalSearch,
} from "turboui";

import { logOut } from "@/routes/auth";
import { useLoaderData } from "react-router-dom";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Outlet } from "react-router-dom";
import { DivLink } from "turboui";
import { Bell } from "./Bell";
import { CompanyDropdown } from "./CompanyDropdown";
import { HelpDropdown } from "./HelpDropdown";
import { NewDropdown } from "./NewDropdown";
import { Review } from "./Review";
import { User } from "./User";

import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { AiSidebar } from "@/features/AiSidebar";
import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { Paths, usePaths } from "@/routes/paths";

function Navigation({ company }: { company: Api.Company }) {
  const size = useWindowSizeBreakpoints();

  if (size === "xs") {
    return <MobileNavigation company={company} />;
  } else {
    return <DesktopNavigation company={company} />;
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
          <div className="font-bold">{company.name}</div>
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

function DesktopNavigation({ company }: { company: Api.Company }) {
  const me = useMe()!;
  const paths = usePaths();

  const handleGlobalSearch = React.useCallback(async ({ query }: { query: string }): Promise<GlobalSearch.SearchResult> => {
    try {
      const result = await Api.globalSearch({ query });
      
      return {
        projects: result.projects?.map(project => ({
          id: project.id!,
          name: project.name!,
          link: paths.projectPath(project.id!),
          champion: project.champion ? { fullName: project.champion.fullName! } : null,
          space: project.space ? { name: project.space.name! } : null,
        })) || [],
        goals: result.goals?.map(goal => ({
          id: goal.id!,
          name: goal.name!,
          link: paths.goalPath(goal.id!),
          champion: goal.champion ? { fullName: goal.champion.fullName! } : null,
          space: goal.space ? { name: goal.space.name! } : null,
        })) || [],
        tasks: result.tasks?.map(task => ({
          id: task.id!,
          name: task.name!,
          link: paths.taskPath(task.id!),
          milestone: task.milestone ? {
            project: task.milestone.project ? {
              name: task.milestone.project.name!,
              space: task.milestone.project.space ? { name: task.milestone.project.space.name! } : null,
            } : null,
          } : null,
        })) || [],
        people: result.people?.map(person => ({
          id: person.id!,
          fullName: person.fullName!,
          title: person.title || null,
          link: paths.profilePath(person.id!),
        })) || [],
        workMapLink: result.workMapLink || null,
      };
    } catch (error) {
      console.error("Global search failed:", error);
      return {};
    }
  }, [paths]);

  const handleNavigate = React.useCallback((link: string) => {
    window.location.href = link;
  }, []);

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

          <div className="flex items-center gap-2.5 border-l border-surface-outline px-4">
            <SectionLink to={paths.homePath()} icon={IconHome2}>
              Home
            </SectionLink>

            <SectionLink to={paths.workMapPath()} icon={IconBuildingEstate}>
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
        
        <div className="flex-1 max-w-md mx-8">
          <GlobalSearch
            search={handleGlobalSearch}
            onNavigate={handleNavigate}
            testId="header-global-search"
          />
        </div>

        <div className="flex items-center gap-2 flex-row-reverse">
          <User />
          <Bell />

          <div className="border-r border-surface-outline px-2.5 mr-2 flex items-center gap-2">
            <NewDropdown />
            <HelpDropdown company={company} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLink({ to, children, icon }) {
  return (
    <DivLink
      to={to}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-base px-1.5 py-0.5 rounded"
    >
      {React.createElement(icon, { size: 16 })}
      {children}
    </DivLink>
  );
}

export default function CompanyLayout() {
  const { company } = useLoaderData() as { company: Api.Company };
  const outletDiv = React.useRef<HTMLDivElement>(null);

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex flex-col h-screen">
      <Navigation company={company} />
      <div className="flex-1 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>

      <DevBar />
      <AiSidebar />
    </div>
  );
}
