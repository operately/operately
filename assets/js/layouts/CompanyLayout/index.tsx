import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Api from "@/api";

import { useLoaderData } from "react-router-dom";

import { DivLink } from "@/components/Link";
import { Outlet } from "react-router-dom";
import { User } from "./User";
import { Bell } from "./Bell";
import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Review } from "./Review";
import { CompanyDropdown } from "./CompanyDropdown";
import { NewDropdown } from "./NewDropdown";

import { DevBar } from "@/features/DevBar";
import { Paths } from "@/routes/paths";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";

function NavigationContainer({ children }) {
  return (
    <div className="transition-all z-50 py-1.5 bg-base border-b border-surface-outline hidden sm:block">{children}</div>
  );
}

function Navigation({ company }: { company: Api.Company }) {
  return (
    <NavigationContainer>
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

            <SectionLink to={Paths.goalsPath()} icon={Icons.IconTarget}>
              Goals
            </SectionLink>

            <SectionLink to={Paths.projectsPath()} icon={Icons.IconHexagons}>
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
          <NewDropdown />
        </div>
      </div>
    </NavigationContainer>
  );
}

function MobileNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-base border-t border-surface-outline py-3 sm:hidden">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <SectionLink to={Paths.homePath()} icon={Icons.IconHome2}>
            Home
          </SectionLink>

          <SectionLink to={Paths.goalsPath()} icon={Icons.IconTarget}>
            Goals
          </SectionLink>

          <SectionLink to={Paths.projectsPath()} icon={Icons.IconHexagons}>
            Projects
          </SectionLink>

          <SectionLink to={Paths.projectsPath()} icon={Icons.IconCoffee}>
            Review
          </SectionLink>
        </div>
      </div>
    </div>
  );
}

function SectionLink({ to, children, icon }) {
  return (
    <DivLink
      to={to}
      className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-surface-base px-1.5 py-0.5 rounded flex-col sm:flex-row"
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
      <MobileNavigation company={company} />
      <DevBar />
    </div>
  );
}
