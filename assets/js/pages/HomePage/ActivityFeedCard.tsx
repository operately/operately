import React from "react";

import { Card } from "./Card";
import * as Icons from "@tabler/icons-react";

export function ActivityFeedCard() {
  return (
    <Card colSpan={2} linkTo="/home/activity">
      <h1 className="font-bold flex items-center gap-2">
        <Icons.IconFileRss size={20} /> Activity Feed
      </h1>
      <div className="flex flex-col items-center justify-center h-full -mt-4">
        <Icons.IconHelicopter size={20} className="text-pink-400" />
        <div className="font-medium mt-2 text-sm">Waiting for news to arrive.</div>
      </div>
    </Card>
  );
}
