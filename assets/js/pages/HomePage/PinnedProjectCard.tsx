import React from "react";

import { Card, CardSectionTitle } from "./Card";
import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";

export function PinnedProjectCard({ pin }) {
  return (
    <Card key={pin.id} linkTo={`/projects/${pin.pinnedId}`}>
      <div className="h-full flex flex-col justify-between gap-4">
        <h1 className="font-bold flex items-center gap-2">
          <Icons.IconTableFilled size={20} /> {pin.pinned.name}
        </h1>

        <div className="flex-1 flex flex-col gap-4">
          <div>
            <CardSectionTitle title="Phase" />
            <div className="font-bold capitalize">{pin.pinned.phase}</div>
          </div>

          <div>
            <CardSectionTitle title="Next Milestone" />
            {pin.pinned.milestones.filter((m) => m.status === "pending").length > 0 ? (
              <div className="font-bold capitalize">
                {pin.pinned.milestones.filter((m) => m.status === "pending")[0].title}
              </div>
            ) : (
              <div className="text-white-2">No milestones</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pin.pinned.contributors.map((c) => (
            <div key={c.person.id} className="mt-4">
              <Avatar size="tiny" person={c.person} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
