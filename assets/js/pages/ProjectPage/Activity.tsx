import React from "react";

import Avatar, { AvatarSize } from "@/components/Avatar";
import RichContent from "@/components/RichContent";
import { useMe } from "@/graphql/Me";
import * as Chat from "@/components/Chat";

function UpdateComment({ comment }) {
  return (
    <div className="flex items-start gap-4 border-t border-gray-700 p-4 px-7">
      <div className="mt-1">
        <Avatar person={comment.author} size={AvatarSize.Small} />
      </div>
      <div className="w-full">
        <div className="flex gap-1 justify-between">
          <div className="flex gap-1 justify-between">
            <div className="font-bold">{comment.author.fullName}</div>
            &middot;
            <div className="text-sm text-gray-400">{comment.author.title}</div>
          </div>

          <div className="text-gray-300 mr-1">
            {/* <FormattedTime format="relative" date={comment.insertedAt} /> */}
          </div>
        </div>
        <div className="mt-1">{comment.content}</div>
      </div>
    </div>
  );
}

function Update({ update }): JSX.Element {
  return (
    <Chat.Container>
      <Chat.Header
        author={update.author}
        acknowlegment={null}
        time={update.insertedAt}
      />

      <Chat.Message>
        <RichContent jsonContent={update.message} />
      </Chat.Message>
    </Chat.Container>
  );
}

// function ProjectCreatedActivity({ authorFullName, date }) {
//   return (
//     <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
//       <div className="absolute right-2">
//         {/* <FormattedTime date={date} /> */}
//       </div>
//       Project Created by {authorFullName}
//     </div>
//   );
// }

function Event({ eventData }): JSX.Element {
  switch (eventData.__typename) {
    case "ActivityStatusUpdate":
      return <Update update={eventData} />;

    case "ActivityCreated":
      return <></>;

    default:
      throw "Unknown event type " + eventData.__typename;
  }
}

export default function Activity({ data }): JSX.Element {
  const activities: any[] = data.project.activities;

  return (
    <div className="mt-[76px]">
      {activities.map((u, i) => (
        <Event key={i} eventData={u} />
      ))}
    </div>
  );
}
