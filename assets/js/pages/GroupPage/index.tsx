import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";

interface LoadedData {
  group: Groups.Group;
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
  });

  return { group: groupData.data.group };
}

export function Page() {
  const [{ group }] = Paper.useLoadedData() as [LoadedData, () => void];

  useDocumentTitle(group.name);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/groups`}>
          <Icons.IconUsers size={16} stroke={3} />
          Groups
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="mb-8">
          <h1 className="font-extrabold text-2xl">{group.name}</h1>
          <p className="mb-8">{group.mission}</p>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

// <div className="mb-4">
//   <GroupMission groupId={id} mission={data.group.mission} onMissionChanged={refetch} />
// </div>

// <MemberList members={data.group.members} />
// <AddMembersModal groupId={id} members={data.group.members} onSubmit={handleAddMembersModalSubmit} />

// <PointsOfContact
//   groupId={id}
//   groupName={data.group.name}
//   pointsOfContact={data.group.pointsOfContact}
//   onAddContact={refetch}
// />

// <Projects groupId={id} />
// <Objectives groupId={id} />

// function MemberList({ members }: { members: Person[] }) {
//   return (
//     <div className="flex gap-2 mb-4">
//       {members.map((m: Person) => (
//         <Avatar key={m.id} person={m} />
//       ))}
//     </div>
//   );
// }
