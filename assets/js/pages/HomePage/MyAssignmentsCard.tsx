import React from "react";

import { Card } from "./Card";
import * as Icons from "@tabler/icons-react";

export function MyAssignmentsCard() {
  return (
    <Card colSpan={2} linkTo="/home/my-assignments">
      <h1 className="font-bold flex items-center gap-2">
        <Icons.IconSmartHome size={20} /> My Assignments
      </h1>
      <div className="flex flex-col items-center justify-center h-full -mt-4">
        <Icons.IconSparkles size={20} className="text-yellow-400" />
        <div className="font-medium mt-2 text-sm">Nothing for you today.</div>
      </div>
    </Card>
  );
}
