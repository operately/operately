import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import MemberList from "./MemberList";

import { useLoadedData } from "./loader";

export function Page() {
  const { company, group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <div className="-mx-16 -mt-12 mb-8 border-b border-surface-outline bg-surface-dimmed rounded-t">
            <div className="flex items-center justify-between px-4">
              <div className="font-medium text-sm w-1/8">{group.name}</div>
              <div className="flex items-center justify-center flex-1 gap-2">
                <div className={"border-b-2 border-orange-500 px-2 -mb-px py-1 pt-2 font-bold"}>Overview</div>
                <div className="border-b-2 border-transparent px-2 -mb-px py-1 pt-2 text-content-dimmed">
                  Discussions
                </div>
                <div className="border-b-2 border-transparent px-2 -mb-px py-1 pt-2 text-content-dimmed">Goals</div>
                <div className="border-b-2 border-transparent px-2 -mb-px py-1 pt-2 text-content-dimmed">Projects</div>
                <div className="border-b-2 border-transparent px-2 -mb-px py-1 pt-2 text-content-dimmed">KPIs</div>
              </div>

              <div className="font-medium text-sm w-1/8">Settings</div>
            </div>
          </div>

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
            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">Quick Actions</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Add a goal
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Start a project
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Invite a member
                </div>
              </div>
            </div>

            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">Points Of Contact</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icons.IconBrandSlack size={16} className="text-accent-1" /> Operately Slack Channel
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconPhoneCall size={16} className="text-accent-1" /> John +1 (555) 555-5555
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconMail size={16} className="text-accent-1" /> product@operately.com
                </div>
              </div>
            </div>

            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">Goal Stats</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-accent-1" /> 5 goals on track
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-yellow-500" /> 1 goal is lagging
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-red-500" /> 4 goals have no check-ins
                </div>
              </div>
            </div>

            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">Project Stats</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-accent-1" /> 9 projects on track
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-yellow-500" /> 2 projects behind schedule
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-red-500" /> No projects is at risk
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-red-500" /> 1 project has no check-ins
                </div>
              </div>
            </div>

            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">KPI Stats</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-accent-1" /> COC 5% above target
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-yellow-500" /> BAU 2% below target
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-red-500" /> Error Rate 60% above target
                </div>

                <div className="flex items-center gap-2 underline">
                  <Icons.IconCircleFilled size={16} className="text-red-500" /> 1 KPI has no check-ins
                </div>
              </div>
            </div>

            <div className="border border-stroke-base rounded p-12 py-8">
              <div className="text-lg font-bold">Latest Discussions</div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Add a goal
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Start a project
                </div>

                <div className="flex items-center gap-2">
                  <Icons.IconPlus size={16} className="text-accent-1" /> Invite a member
                </div>
              </div>
            </div>
          </div>

          <Paper.DimmedSection>Activity</Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
