import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import { AssignmentList } from "@/components/AssignmentList";

export function MyAssignmentsPage() {
  return (
    <Paper.Root size="large">
      <Paper.Navigation>
        <Paper.NavItem linkTo="/">
          <Icons.IconStarFilled size={16} stroke={3} />
          Home
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Paper.Title>My Assignments</Paper.Title>

        <AssignmentList />
      </Paper.Body>
    </Paper.Root>
  );
}
