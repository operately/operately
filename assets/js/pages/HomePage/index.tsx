import React from "react";
import { useMe } from "@/graphql/Me";
import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

export function HomePage() {
  const { data, loading, error } = useMe();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

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

        <EmptyInbox />

        <Paper.SectionHeader>Upcomming this week</Paper.SectionHeader>

        <div className="flex flex-col mt-6">
          <div className="flex items-center justify-between mx-14 hover:bg-dark-4 px-2 py-2 cursor-pointer">
            <div className="flex gap-2 items-center justify-center">
              <div
                className="flex gap-2 items-center justify-center"
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "100%",
                  background: "linear-gradient(to right top, var(--color-green-400), var(--color-sky-400))",
                }}
              >
                <Icons.IconFlag size={24} stroke={2} className="text-dark-1" />
              </div>
              The <strong>Launch Website</strong> milestone on the <strong>Ship B2B Leadership ebook</strong> project is
              due
            </div>
            <div className="bg-shade-2 text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
              Tomorrow
            </div>
          </div>

          <div className="flex items-center justify-between mx-14 hover:bg-dark-4 px-2 py-2 cursor-pointer">
            <div className="flex gap-2 items-center justify-center">
              <div
                className="flex gap-2 items-center justify-center"
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "100%",
                  background: "linear-gradient(to right top, var(--color-pink-400), var(--color-purple-400))",
                }}
              >
                <Icons.IconReport size={24} stroke={2} className="text-dark-1" />
              </div>
              Write a status update for the <strong>Ship B2B Leadership ebook</strong>
            </div>
            <div className="bg-shade-2 text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
              Tomorrow
            </div>
          </div>
        </div>
      </Paper.Body>
    </Paper.Root>
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
