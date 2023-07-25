import React from "react";

import * as Cards from "@/components/Cards";
import * as Icons from "@tabler/icons-react";

import * as Projects from "@/graphql/Projects";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";

export default function MessageBoardCard({ project }: { project: Projects.Project }): JSX.Element {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/updates`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Icons.IconMessage size={20} className="text-white-1" />
          <Cards.Title>Message Board</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>
        <Content project={project} />
      </Cards.Body>
    </Cards.Card>
  );
}

function Content({ project }: { project: Projects.Project }) {
  const updates = project.updates;

  if (updates.length === 0) {
    return <EmptyState />;
  } else {
    return <ItemList updates={updates} />;
  }
}

function EmptyState() {
  return (
    <div className="flex items-center flex-col w-full gap-4 justify-center mt-8 text-base px-8">
      <div className="bg-green-500/80 rounded-full p-3">
        <Icons.IconMailOpenedFilled size={40} className="text-white-1/80" />
      </div>

      <p className="text-center font-medium">
        Post status updates, announcements, and other messages to keep your team in the loop.
      </p>
    </div>
  );
}

function ItemList({ updates }: { updates: Projects.Update[] }) {
  return (
    <div className="-mx-4 px-2">
      {updates.map((update) => (
        <Item key={update.id} update={update} />
      ))}
    </div>
  );
}

function Item({ update }: { update: Projects.Update }) {
  return (
    <div className="flex items-center gap-2 border-b border-shade-1 py-1 last:border-none">
      <Avatar person={update.author} size="small" />

      <div className="flex items-center gap-1.5 font-medium flex-1">
        <div className="line-clamp-2 text-sm">
          <RichContent jsonContent={update.message} />
        </div>
      </div>
    </div>
  );
}
