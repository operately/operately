import React from "react";

import * as Cards from "@/components/Cards";
import * as Icons from "@tabler/icons-react";

import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";

export default function MessageBoardCard({ project }: { project: Projects.Project }): JSX.Element {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/updates`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
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

function ItemList({ updates }: { updates: Updates.Update[] }) {
  return (
    <div className="flex flex-col gap-2 py-2">
      {updates.map((update) => (
        <Item key={update.id} update={update} />
      ))}
    </div>
  );
}

function Item({ update }: { update: Updates.Update }) {
  if (update.messageType === "review") {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar person={update.author} size="small" />

      <div className="flex-1">
        <ItemTitle update={update} />

        <div className="line-clamp-1 text-xs font-medium">
          <RichContent jsonContent={update.message} />
        </div>
      </div>
    </div>
  );
}

function ItemTitle({ update }: { update: Updates.Update }) {
  if (update.messageType === "review") {
    return <div className="text-xs font-bold text-yellow-400/80">Check-In</div>;
  }

  if (update.messageType === "status_update") {
    return <div className="text-xs font-bold text-yellow-400/80">Status Update</div>;
  }

  if (update.messageType === "phase_change") {
    return (
      <div className="text-xs font-bold text-pink-400/80">
        <span className="capitalize">{update.previousPhase}</span> →{" "}
        <span className="capitalize">{update.newPhase}</span>
      </div>
    );
  }

  if (update.messageType === "health_change") {
    return (
      <div className="text-xs font-bold text-lime-400/80">
        <span className="capitalize">{update.previousHealth?.split("_")?.join(" ")}</span> →{" "}
        <span className="capitalize">{update.newHealth?.split("_").join(" ")}</span>
      </div>
    );
  }

  if (update.messageType === "message") {
    return <div className="text-xs font-bold text-white-1">{update.title}</div>;
  }

  throw new Error(`Unknown update type: ${update.messageType}`);
}
