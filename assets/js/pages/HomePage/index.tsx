import React from "react";
import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import * as Assignments from "@/graphql/Assignments";

import { sortAndGroupAssignemnts, SortedAndGroupedAssignments } from "./sortAndGroupAssignments";

export function HomePage() {
  return (
    <Paper.Root size="large">
      <Tabs>
        <Tabs.List>
          <Tabs.Tab active>
            <Icons.IconInbox size={16} stroke={3} />
            My Assignments
          </Tabs.Tab>

          <Tabs.Tab active={false}>
            <Icons.IconStar size={16} stroke={3} />
            Followed Activity
          </Tabs.Tab>

          <Tabs.Tab active={false}>
            <Icons.IconClipboardText size={16} stroke={3} />
            My Projects
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper.Body>
        <Paper.Title>My Assignments</Paper.Title>

        <AssignmentList />
      </Paper.Body>
    </Paper.Root>
  );
}

function AssignmentList() {
  const { data, loading, error } = Assignments.useAssignments();

  if (loading || error) {
    console.log(error);
    return null;
  }

  const assignments: SortedAndGroupedAssignments = sortAndGroupAssignemnts(data.assignments);
  const hasPending = assignments.pending.length > 0;
  const hasUpcoming = assignments.upcoming.length > 0;

  return (
    <div>
      {hasPending ? assignments.pending.map((a) => a.element) : <EmptyInbox />}

      {hasUpcoming && (
        <>
          <Paper.SectionHeader>Upcomming</Paper.SectionHeader>
          {assignments.upcoming.map((a, i) => (
            <React.Fragment key={i}>{a.element}</React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Icons.IconSparkles size={24} className="text-yellow-400" />
      <div className="font-medium mt-2">Nothing for you today.</div>
    </div>
  );
}

function Tabs({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[40px] flex justify-center mx-16 mb-4">{children}</div>;
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center p-1.5 gap-3">{children}</div>;
};

Tabs.Tab = function TabsTab({ active = false, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={classnames(
        "px-4 py-1 flex items-center gap-2 font-semibold rounded-[40px]",
        active
          ? "border-2 border-purple-500 bg-dark-3 text-dark-1 font-bold"
          : "border-2 border-dark-5 bg-transparent text-white-1/70 cursor-pointer hover:bg-dark-3 hover:text-pink-400 transition transition-duration-50",
      )}
      style={{
        background: active ? "linear-gradient(45deg, var(--color-pink-400), var(--color-purple-400))" : "",
      }}
    >
      {children}
    </div>
  );
};
