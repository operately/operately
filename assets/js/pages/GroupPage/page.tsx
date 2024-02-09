import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import MemberList from "./MemberList";

import { useLoadedData } from "./loader";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { ComingSoonBadge } from "@/components/ComingSoonBadge";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="overview" />

          <div className="mt-12">
            <div className="font-medium flex items-center gap-2 justify-center mb-2">
              {React.createElement(Icons[group.icon], { size: 48, className: group.color, strokeWidth: 1 })}
            </div>

            <div className="font-bold text-4xl text-center">{group.name}</div>

            <div className="text-center">
              <div className="">{group.mission}</div>
            </div>
          </div>

          <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="group-members">
            <MemberList group={group} />
          </div>

          <div className="mt-8 mb-4" />

          <div className="grid grid-cols-2 gap-8">
            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">Quick Actions</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>

            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">Points Of Contact</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>

            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">Goal Stats</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>

            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">Project Stats</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>

            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">KPI Stats</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>

            <div className="border border-stroke-base rounded p-8 py-4">
              <div className="text-lg font-bold">Latest Discussions</div>
              <ComingSoonBadge />
              <div className="mt-4 flex flex-col gap-2"></div>
            </div>
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs font-bold">Activity</div>
            <ComingSoonBadge />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
