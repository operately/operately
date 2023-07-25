import React from "react";

import * as Cards from "@/components/Cards";
import * as Icons from "@tabler/icons-react";

import * as Projects from "@/graphql/Projects";

import RichContent from "@/components/RichContent";

export default function MessageBoardCard({ project }: { project: Projects.Project }): JSX.Element {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/updates`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Icons.IconMessage size={20} className="text-white-1" />
          <Cards.Title>Message Board</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>Hello</Cards.Body>
    </Cards.Card>
  );
}

function Item({ update }: { update: Projects.Update }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-medium flex-1">
        <div className="line-clamp-2">
          <RichContent jsonContent={update.message} />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 mt-3">
        {update.acknowledged ? (
          <>
            <Icons.IconCircleCheckFilled size={14} className="text-green-400" />
            acknowledged
          </>
        ) : (
          <>
            <Icons.IconClockFilled size={14} className="text-yellow-400" />
            waiting for acknowledgment
          </>
        )}
      </div>
    </div>
  );
}
