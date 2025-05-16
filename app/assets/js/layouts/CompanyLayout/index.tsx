import * as Api from "@/api";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { logOut } from "@/routes/auth";
import { useLoaderData } from "react-router-dom";

import { Outlet } from "react-router-dom";
import { DivLink } from "turboui";

import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { Paths } from "@/routes/paths";

function Navigation({
  company,
  isSidebarCollapsed,
  toggleSidebar,
}: {
  company: Api.Company;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}) {
  const size = useWindowSizeBreakpoints();

  if (size === "xs") {
    return <MobileNavigation company={company} />;
  } else {
    return (
      <DesktopSidebarNavigation company={company} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
    );
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
          <div className="font-bold">{company.name || ""}</div>
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

function DesktopSidebarNavigation({
  company,
  isCollapsed,
  toggleSidebar,
}: {
  company: Api.Company;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}) {
  const handleLogOut = async () => {
    const res = await logOut();

    if (res === "success") {
      window.location.href = "/";
    }
  };

  return (
    <div className={`transition-all duration-200 z-50 bg-base h-screen ${isCollapsed ? "w-12" : "w-64"}`}>
      <div className="flex flex-col h-full">
        {/* Top section with toggle */}
        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
          <div className="cursor-pointer" onClick={toggleSidebar}>
            {isCollapsed ? (
              <Icons.IconArrowRight size={18} className="text-orange-700" />
            ) : (
              <Icons.IconArrowLeft size={16} />
            )}
          </div>
        </div>

        {/* Company section */}
        <div className={`p-4 border-b border-surface-outline ${isCollapsed ? "hidden" : ""}`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              {company.name ? company.name.charAt(0) : ""}
            </div>
            <div className="font-semibold">{company.name || ""}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <SidebarLink to={Paths.homePath()} icon={Icons.IconHome2} isCollapsed={isCollapsed}>
            Home
          </SidebarLink>

          <SidebarLink to={Paths.goalsPath()} icon={Icons.IconTargetArrow} isCollapsed={isCollapsed}>
            Goals
          </SidebarLink>

          <SidebarLink to={Paths.projectsPath()} icon={Icons.IconTable} isCollapsed={isCollapsed}>
            Projects
          </SidebarLink>

          <SidebarLink to={Paths.reviewPath()} icon={Icons.IconCoffee} isCollapsed={isCollapsed}>
            Review
          </SidebarLink>

          <SidebarLink to={Paths.peoplePath()} icon={Icons.IconUserCircle} isCollapsed={isCollapsed}>
            People
          </SidebarLink>

          {/* Bell notification styled consistently with other items */}
          <SidebarLink to={Paths.notificationsPath()} icon={Icons.IconBell} isCollapsed={isCollapsed}>
            Notifications
          </SidebarLink>

          {/* User component styled consistently with other items */}
          <SidebarLink to={Paths.accountPath()} icon={Icons.IconUser} isCollapsed={isCollapsed}>
            Account
          </SidebarLink>

          <SidebarLink to={Paths.companyAdminPath()} icon={Icons.IconCircleKey} isCollapsed={isCollapsed}>
            Admin
          </SidebarLink>
        </div>

        {/* Bottom controls */}
        <div className="border-t border-surface-outline p-4">
          <SidebarAction onClick={() => {}} icon={Icons.IconPlus} isCollapsed={isCollapsed}>
            New
          </SidebarAction>

          <SidebarAction onClick={() => {}} icon={Icons.IconHelp} isCollapsed={isCollapsed}>
            Help
          </SidebarAction>

          <SidebarLink to={Paths.lobbyPath()} icon={Icons.IconSwitch} isCollapsed={isCollapsed}>
            Switch
          </SidebarLink>

          <SidebarAction onClick={handleLogOut} icon={Icons.IconDoorExit} isCollapsed={isCollapsed}>
            Log Out
          </SidebarAction>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ to, children, icon, isCollapsed }) {
  return (
    <DivLink
      to={to}
      className={`font-semibold flex items-center gap-3 cursor-pointer hover:bg-surface-base ${isCollapsed ? "px-1 py-3 justify-center" : "px-4 py-3"}`}
    >
      {React.createElement(icon, { size: isCollapsed ? 18 : 16 })}
      {/* Only show text when not collapsed */}
      {!isCollapsed && <span>{children}</span>}
    </DivLink>
  );
}

function SidebarAction({ onClick, children, icon, isCollapsed }) {
  return (
    <div
      onClick={onClick}
      className={`font-semibold flex items-center gap-3 cursor-pointer hover:bg-surface-base px-4 py-2 mb-1 ${isCollapsed ? "justify-center" : ""}`}
    >
      {React.createElement(icon, { size: 16 })}
      {!isCollapsed && <span>{children}</span>}
    </div>
  );
}

export default function CompanyLayout() {
  const { company } = useLoaderData() as { company: Api.Company };
  const outletDiv = React.useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex h-screen">
      <Navigation company={company} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col" ref={outletDiv}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
