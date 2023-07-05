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
      </Paper.Body>
    </Paper.Root>
  );

  // return (
  //   <div className="mx-auto max-w-4xl mt-16">
  //     <Tabs>
  //       <Tabs.List>
  //         <Tabs.Tab active>
  //           Assignments
  //           <div className="bg-red-400 rounded-full h-4 w-4 text-[10px] text-dark-1 flex items-center justify-center">
  //             5
  //           </div>
  //         </Tabs.Tab>

  //         <Tabs.Tab active={false}>Followed Activity</Tabs.Tab>
  //         <Tabs.Tab active={false}>My Projects</Tabs.Tab>
  //       </Tabs.List>
  //     </Tabs>

  //     <div className="border border-shade-2 bg-dark-2 rounded">
  //       <div className="px-8 py-8 border-b border-shade-2" style={{ minHeight: "250px" }}>
  //         <div className="flex items-center gap-2 mb-4">
  //           <div className="flex items-center justify-between uppercase text-sm font-bold tracking-wider">OVERDUE</div>
  //         </div>

  //         <div className="border-y border-shade-2 py-2">
  //           <div className="flex items-center gap-2">
  //             <div className="bg-red-400 text-dark-2 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
  //               2 days ago
  //             </div>
  //             <div>
  //               <strong>John Mayer</strong> is waiting for your acknowledgment on the{" "}
  //               <strong>Ship B2B Leadership ebook</strong>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="border-y border-shade-2 py-2">
  //           <div className="flex items-center gap-2">
  //             <div className="bg-red-400 text-dark-2 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
  //               Yesterday
  //             </div>
  //             <div>
  //               The <strong>Launch Website</strong> milestone on the <strong>Superpace</strong> project is overdue
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="px-8 py-8 border-b border-shade-2" style={{ minHeight: "250px" }}>
  //         <div className="flex items-center gap-2 mb-4">
  //           <div className="flex items-center justify-between uppercase text-sm font-bold tracking-wider">TODAY</div>
  //         </div>

  //         <div className="border-y border-shade-2 py-2">
  //           <div className="flex items-center gap-2">
  //             <div className="bg-shade-2 text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
  //               Today
  //             </div>
  //             <div>
  //               <strong>Melisa Kutruj</strong> is waiting for your acknowledgment on the{" "}
  //               <strong>HR System Update</strong>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="px-8 py-8" style={{ minHeight: "250px" }}>
  //         <div className="flex items-center gap-2 mb-4">
  //           <div className="flex items-center justify-between uppercase text-sm font-bold tracking-wider">
  //             UPCOMMING
  //           </div>
  //         </div>

  //         <div className="border-y border-shade-2 py-2">
  //           <div className="flex items-center gap-2">
  //             <div className="bg-shade-2 text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
  //               Tomorrow
  //             </div>
  //             <div>
  //               Write a status update for the <strong>Ship B2B Leadership ebook</strong>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="border-y border-shade-2 py-2">
  //           <div className="flex items-center gap-2">
  //             <div className="bg-shade-2 text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center">
  //               In 2 days
  //             </div>
  //             <div>
  //               The <strong>Launch Website</strong> milestone on the <strong>Superpace</strong> project is due
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Icons.IconSparkles size={24} className="text-yellow-400" />
      <div className="font-medium mt-2">Nothing new for you today.</div>
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
          ? "border-2 border-pink-400 bg-dark-3 text-pink-400"
          : "border-2 border-dark-5 bg-transparent text-white-1/70 cursor-pointer hover:bg-dark-3 hover:text-pink-400 transition transition-duration-50",
      )}
    >
      {children}
    </div>
  );
};
