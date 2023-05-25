import React from "react";

import RichContent from "@/components/RichContent";
import * as Chat from "@/components/Chat";

function Update({ update }): JSX.Element {
  return (
    <Chat.Container>
      <Chat.Header
        author={update.author}
        acknowledgingPerson={update.acknowledgingPerson}
        time={update.insertedAt}
      />

      <Chat.Message>
        <RichContent jsonContent={update.message} />
      </Chat.Message>

      <Chat.Comments>
        {update.comments.map((c, i) => (
          <Chat.Comment key={i} author={c.author} time={c.insertedAt}>
            <RichContent jsonContent={c.message} />
          </Chat.Comment>
        ))}
      </Chat.Comments>
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
