import React from "react";

import { useMe } from "@/graphql/Me";
import * as Chat from "@/components/Chat";

import Select from "react-select";

function Event({ eventData }): JSX.Element {
  const { data, loading, errror } = useMe();

  if (loading) return <></>;
  if (errror) throw errror.message;

  switch (eventData.__typename) {
    case "ActivityStatusUpdate":
      return <Chat.Post update={eventData} currentUser={data.me} />;

    case "ActivityCreated":
      return <></>;

    default:
      throw "Unknown event type " + eventData.__typename;
  }
}

export default function Activity({ data }): JSX.Element {
  const activities: any[] = data.project.activities;

  return (
    <div>
      <div className="flex flex-row-reverse items-center mt-[26px] mb-[20px] gap-[10px]">
        <Select
          isSearchable={false}
          unstyled={true}
          className="text-sm"
          classNames={{
            container: () => "border border-light-2 rounded-[5px]",
            control: () => "flex items-center px-[10px]",
            menu: () => "border border-light-2 bg-white",
            option: ({ isSelected, isFocused }) => {
              if (isSelected) {
                return "cursor-pointer px-2 py-1 bg-brand-1 text-white";
              } else if (isFocused) {
                return "cursor-pointer px-2 py-1 bg-brand-2";
              } else {
                return "cursor-pointer px-2 py-1";
              }
            },
          }}
          styles={{
            control: () => ({
              height: "28px",
              minHeight: "28px",
              gap: "18px",
              cursor: "pointer",
            }),
            option: () => ({
              cursor: "pointer",
            }),
          }}
          options={[
            {
              value: "everything",
              label: "Everything",
            },
            {
              value: "status_updates",
              label: "Status Updates",
            },
          ]}
          defaultValue={{ value: "everything", label: "Everything" }}
        />
        <span className="text-sm">View:</span>
      </div>

      {activities.map((u, i) => (
        <Event key={i} eventData={u} />
      ))}
    </div>
  );
}
