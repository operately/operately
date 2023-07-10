import React from "react";

import * as Icons from "@tabler/icons-react";

import { useMe, usePins, Pin } from "@/graphql/Me";
import { useCompany } from "@/graphql/Companies";

import { AccountCard } from "./AccountCard";
import { MyAssignmentsCard } from "./MyAssignmentsCard";
import { ActivityFeedCard } from "./ActivityFeedCard";
import { MyProjectsCard } from "./MyProjectsCard";
import { PinnedProjectCard } from "./PinnedProjectCard";

export function HomePage() {
  const meData = useMe();
  const pinsData = usePins({ fetchPolicy: "network-only" });
  const companyData = useCompany();

  if (!meData.data || !companyData.data || !pinsData.data) {
    return null;
  }

  const me = meData.data.me;
  const company = companyData.data.company;
  const pins: Pin[] = pinsData.data.pins;

  return (
    <div className="max-w-5xl mx-auto mt-20 flex flex-col gap-8">
      <div className="flex items-center justify-center">
        <input
          type="text"
          className="w-1/2 rounded-lg px-4 py-2 bg-dark-3 block border border-shade-2 placeholder:text-white-2"
          placeholder="Search projects, people, goals..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <AccountCard me={me} company={company} />
        <MyAssignmentsCard />
        <ActivityFeedCard />
        <MyProjectsCard />

        {pins.map((pin) => (
          <PinnedProjectCard key={pin.id} pin={pin} />
        ))}
      </div>

      <div className="mb-8 flex items-center justify-center text-sm gap-2">
        <div className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer">
          <Icons.IconGridPattern size={16} />
          Edit Home Page
        </div>

        <div className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer">
          <Icons.IconArrowUp size={16} /> Back to Top
        </div>
      </div>
    </div>
  );
}
