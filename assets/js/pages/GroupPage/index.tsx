import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";

import MemberList from "./MemberList";
import OwnedProjects from "./OwnedProjects";

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
    <Paper.Root size="large">
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/groups`}>
          <Icons.IconUsers size={16} stroke={3} />
          Groups
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="mb-4">
          <h1 className="font-extrabold text-2xl">{group.name}</h1>
          <div>{group.mission}</div>
        </div>

        <MemberList group={group} />

        <div className="flex flex-col gap-4 mt-8">
          <OwnedProjects group={group} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

// <PointsOfContact
//   groupId={id}
//   groupName={data.group.name}
//   pointsOfContact={data.group.pointsOfContact}
//   onAddContact={refetch}
// />

// <Projects groupId={id} />
// <Objectives groupId={id} />
