import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Api from "@/api";

import { useLoaderData } from "react-router-dom";
import { logOut } from "@/routes/auth";

import { DivLink } from "turboui";
import { Outlet } from "react-router-dom";
import { User } from "./User";
import { Bell } from "./Bell";
import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Review } from "./Review";
import { CompanyDropdown } from "./CompanyDropdown";
import { NewDropdown } from "./NewDropdown";
import { HelpDropdown } from "./HelpDropdown";

import { DevBar } from "@/features/DevBar";
import { Paths } from "@/routes/paths";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { useWindowSizeBreakpoints } from "@/components/Pages";

function Navigation({ company }: { company: Api.Company }) {
  const size = useWindowSizeBreakpoints();

  if (size === "xs") {
    return <MobileNavigation company={company} />;
  } else {
    return <DesktopNavigation company={company} />;
  }
}

function MobileNavigation({ company }: { company: Api.Company }) {
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
          <DivLink className="flex items-center gap-2 cursor-pointer" to={Paths.homePath()}>
            <OperatelyLogo />
          </DivLink>
          <div className="font-bold">{company.name}</div>
        </div>

        <div className="">
          <Icons.IconMenu2 size={24} onClick={() => setOpen(!open)} />
        </div>
      </div>

      {open && (
        <div
          className="flex flex-col bg-base absolute inset-0 top-10 bg-surface-bg border-t border-surface-outline"
          onClick={() => setOpen(false)}
        >
          <MobileSectionLink to={Paths.homePath()} icon={Icons.IconHome2}>
            Home
          </MobileSectionLink>

          <MobileSectionLink to={Paths.goalsPath()} icon={Icons.IconTargetArrow}>
            Goals
          </MobileSectionLink>

          <MobileSectionLink to={Paths.projectsPath()} icon={Icons.IconTable}>
            Projects
          </MobileSectionLink>

          <MobileSectionLink to={Paths.reviewPath()} icon={Icons.IconCoffee}>
            Review
          </MobileSectionLink>

          <MobileSectionLink to={Paths.peoplePath()} icon={Icons.IconUserCircle}>
            People
          </MobileSectionLink>

          <MobileSectionLink to={Paths.notificationsPath()} icon={Icons.IconBell}>
            Notifications
          </MobileSectionLink>

          <MobileSectionLink to={Paths.accountPath()} icon={Icons.IconUser}>
            Account
          </MobileSectionLink>

          <MobileSectionLink to={Paths.companyAdminPath()} icon={Icons.IconCircleKey}>
            Company Admin
          </MobileSectionLink>

          <MobileSectionLink to={Paths.lobbyPath()} icon={Icons.IconSwitch}>
            Switch Company
          </MobileSectionLink>

          <MobileSectionAction onClick={handleLogOut} icon={Icons.IconDoorExit}>
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
  const goalPath = company.enabledExperimentalFeatures?.includes("work_map_page")
    ? Paths.workMapPath()
    : Paths.goalsPath();

  return (
    <div className="transition-all z-50 py-1.5 bg-base border-b border-surface-outline">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={Paths.homePath()}>
            <OperatelyLogo />
          </DivLink>

          <div className="border-l border-surface-outline px-2.5 ml-4">
            <CompanyDropdown company={company} />
          </div>

          <div className="flex items-center gap-2.5 border-l border-surface-outline px-4">
            <SectionLink to={Paths.homePath()} icon={Icons.IconHome2}>
              Home
            </SectionLink>

            <SectionLink to={goalPath} icon={Icons.IconTargetArrow}>
              Goals
            </SectionLink>

            <SectionLink to={Paths.projectsPath()} icon={Icons.IconTable}>
              Projects
            </SectionLink>
          </div>

          <div className="border-l border-surface-outline pl-4">
            <Review />
          </div>
        </div>
        <div className="flex-1"></div>

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
    </div>
  );
}
