import React from "react";

import { Card } from "./Card";
import * as Icons from "@tabler/icons-react";

import { AssignmentList } from "@/components/AssignmentList";

export function MyAssignmentsCard() {
  return (
    <Card colSpan={2} linkTo="/home/my-assignments">
      <h1 className="font-bold flex items-center gap-2">
        <Icons.IconSmartHome size={20} /> My Assignments
      </h1>

      <div className="mt-4">
        <AssignmentList showUpcoming={false} readOnly={true} />
      </div>
    </Card>
  );
}
