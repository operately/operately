import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { useLocation } from "react-router-dom";

import { Outlet } from "react-router-dom";
import { User } from "./User";
import { Bell } from "./Bell";
import { AdminLink } from "./AdminLink";
import { Logo } from "./Logo";
import { DivLink } from "@/components/Link";

import { PerfBar } from "@/features/PerfBar";
import { Paths } from "@/routes/paths";

function NavigationContainer({ children }) {
  return <div className="transition-all z-50 py-1.5 bg-base border-b border-surface-outline">{children}</div>;
}

function Navigation() {
  return (
    <NavigationContainer>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <DivLink className="flex items-center gap-2 cursor-pointer" to={Paths.homePath()}>
            <Logo />
            <div className="font-semibold">Operately</div>
          </DivLink>

          <div className="flex items-center gap-5 border-l border-surface-outline px-4">
            <SectionLink to={Paths.homePath()} icon={Icons.IconHome2}>
              Home
            </SectionLink>

            <SectionLink to={Paths.goalsPath()} icon={Icons.IconTargetArrow}>
              Goals
            </SectionLink>

            <SectionLink to={Paths.projectsPath()} icon={Icons.IconTable}>
              Projects
            </SectionLink>

            <SectionLink to={Paths.peoplePath()} icon={Icons.IconUserCircle}>
              People
            </SectionLink>
          </div>
        </div>
        <div className="flex-1"></div>

        <div className="flex items-center gap-2 flex-row-reverse">
          <User />
          <Bell />
          <AdminLink />
        </div>
      </div>
    </NavigationContainer>
  );
}

function SectionLink({ to, children, icon }) {
  return (
    <DivLink to={to} className="font-semibold flex items-center gap-1 cursor-pointer group">
      {React.createElement(icon, { size: 16 })}
      {children}
    </DivLink>
  );
}

export default function DefaultLayout() {
  const { pathname } = useLocation();
  const outletDiv = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!outletDiv.current) return;

    outletDiv.current.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, outletDiv]);

  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <div className="flex-1 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>
      <PerfBar />
    </div>
  );
}
