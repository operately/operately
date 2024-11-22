import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Outlet } from "react-router-dom";

import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { DivLink } from "@/components/Link";
import { OperatelyLogo } from "@/components/OperatelyLogo";
import { SecondaryButton } from "@/components/Buttons";

export default function SaasAdminLayout() {
  const outletDiv = React.useRef<HTMLDivElement>(null);

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <div className="flex-1 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>
      <DevBar />
    </div>
  );
}

function Navigation() {
  return (
    <div className="mt-8 max-w-6xl mx-auto w-full px-8">
      <div className="flex items-center justify-between">
        <DivLink className="flex items-center gap-2 cursor-pointer" to={"/admin"}>
          <OperatelyLogo width="32px" height="32px" />
          <div className="">
            <span className="font-bold leading-snug">Operately</span>
            <div className="text-xs text-content-accent leading-snug">Saas Admin Panel</div>
          </div>
        </DivLink>

        <div>
          <SecondaryButton linkTo="/" size="sm">
            <Icons.IconDoorExit className="inline-block mr-2" size={16} /> Exit Admin Panel
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
