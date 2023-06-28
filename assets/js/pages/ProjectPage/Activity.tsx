import React from "react";

import * as Activities from "@/graphql/Activities";

// import { useMe } from "@/graphql/Me";
// import * as Chat from "@/components/Chat";

// import Select from "react-select";

// function Event({ eventData }): JSX.Element {
//   const { data, loading, errror } = useMe();

//   if (loading) return <></>;
//   if (errror) throw errror.message;

//   switch (eventData.__typename) {
//     case "ActivityStatusUpdate":
//       return <Chat.Post update={eventData} currentUser={data.me} />;

//     case "ActivityCreated":
//       return <></>;

//     default:
//       throw "Unknown event type " + eventData.__typename;
//   }
// }

// export default function Activity({ data }): JSX.Element {
//   const activities: any[] = data.project.activities;

//   return (
//     <div>
//       <div className="flex flex-row-reverse items-center mt-[26px] mb-[20px] gap-[10px]">
//         <Select
//           isSearchable={false}
//           unstyled={true}
//           className="text-sm"
//           classNames={{
//             container: () => "border border-light-2 rounded-[5px]",
//             control: () => "flex items-center px-[10px]",
//             menu: () => "border border-light-2 bg-white",
//             option: ({ isSelected, isFocused }) => {
//               if (isSelected) {
//                 return "cursor-pointer px-2 py-1 bg-brand-1 text-white";
//               } else if (isFocused) {
//                 return "cursor-pointer px-2 py-1 bg-brand-2";
//               } else {
//                 return "cursor-pointer px-2 py-1";
//               }
//             },
//           }}
//           styles={{
//             control: () => ({
//               height: "28px",
//               minHeight: "28px",
//               gap: "18px",
//               cursor: "pointer",
//             }),
//             option: () => ({
//               cursor: "pointer",
//             }),
//           }}
//           options={[
//             {
//               value: "everything",
//               label: "Everything",
//             },
//             {
//               value: "status_updates",
//               label: "Status Updates",
//             },
//           ]}
//           defaultValue={{ value: "everything", label: "Everything" }}
//         />
//         <span className="text-sm">View:</span>
//       </div>

//       {activities.map((u, i) => (
//         <Event key={i} eventData={u} />
//       ))}
//     </div>
//   );
// }

export default function Activity({ projectId }): JSX.Element {
  const { data, loading, error } = Activities.useListActivities("project", projectId);

  return (
    <div className="px-16 rounded-b-[20px] py-8 bg-dark-2 min-h-[350px] border-t border-shade-1">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <SeparatorLine />
          <SectionTitle title="Project Activity" />
          <SeparatorLine />
        </div>

        {loading && <div>Loading...</div>}
        {error && <div>{error.message}</div>}
        {data && (
          <div>
            {data.activities.map((activity: Activities.Activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activities.Activity }) {
  switch (activity.resourceType + "-" + activity.actionType) {
    case "project-created":
      return <ActivityItemProjectCreated activity={activity} />;
    default:
      return null;
  }
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  return <>Hello</>;
}

function SeparatorLine() {
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return <div className="font-bold py-4 flex items-center gap-2 uppercase tracking-wide">{title}</div>;
}
