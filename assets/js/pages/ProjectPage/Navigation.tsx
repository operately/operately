import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";
import * as gql from "@/gql";

export default function Navigation({ space }: { space: Spaces.Space | gql.Group }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}/projects`}>
        {React.createElement(Icons[space.icon!], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
