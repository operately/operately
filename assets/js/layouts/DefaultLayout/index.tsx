import React from "react";

import { useLocation } from "react-router-dom";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { Outlet } from "react-router-dom";
import { User } from "./User";
import { Bell } from "./Bell";
import { AdminLink } from "./AdminLink";
import { Logo } from "./Logo";
import { DivLink } from "@/components/Link";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/models/companies";

import { PerfBar } from "@/features/PerfBar";

function NavigationContainer({ children }) {
  return (
    <div className="fixed top-0 left-0 right-0 transition-all z-50 py-1.5 bg-base border-b border-surface-outline">
      {children}
    </div>
  );
}

function Navigation() {
  const goToLobby = useNavigateTo("/");
  const { company, loading, error } = Companies.useCompany();

  const showGoals = !loading && !error && Companies.hasFeature(company, "goals");
  const showPeople = !loading && !error && Companies.hasFeature(company, "goals");

  return (
    <NavigationContainer>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={goToLobby}>
            <Logo />
            <div className="font-semibold">Operately</div>
          </div>

          <div className="flex items-center gap-5 border-l border-surface-outline px-4">
            <SectionLink to="/" icon={Icons.IconHome2}>
              Home
            </SectionLink>

            {showGoals && (
              <SectionLink to="/goals" icon={Icons.IconTargetArrow}>
                Goals
              </SectionLink>
            )}

            <SectionLink to="/projects" icon={Icons.IconTable}>
              Projects
            </SectionLink>

            {showPeople && (
              <SectionLink to="/people" icon={Icons.IconUserCircle}>
                People
              </SectionLink>
            )}
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

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // "document.documentElement.scrollTo" is the magic for React Router Dom v6
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
    });
  }, [pathname]);

  return null;
}

export default function DefaultLayout() {
  return (
    <div className="">
      <ScrollToTop />
      <Navigation />
      <Outlet />
      <PerfBar />
    </div>
  );
}
