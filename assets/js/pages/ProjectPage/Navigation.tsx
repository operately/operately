import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";

export default function Navigation({ space }: { space: Groups.Group }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}`}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
