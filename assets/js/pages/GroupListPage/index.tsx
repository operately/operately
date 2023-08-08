import React from "react";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigate } from "react-router-dom";

import Button from "@/components/Button";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";

import client from "@/graphql/client";

interface LoaderData {
  groups: Groups.Group[];
}

export async function loader(): Promise<LoaderData> {
  const groupData = await client.query({
    query: Groups.LIST_GROUPS,
  });

  return {
    groups: groupData.data.groups,
  };
}

export function Page() {
  const [{ groups }] = Paper.useLoadedData() as [LoaderData];

  useDocumentTitle("Groups");

  return (
    <Paper.Root>
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-3xl">Groups</div>

        <Button linkTo="/groups/new" variant="success" data-test-id="add-group">
          <Icons.IconPlus size={16} /> Add Group
        </Button>
      </div>

      <GroupList groups={groups} />
    </Paper.Root>
  );
}

function GroupList({ groups }: { groups: Groups.Group[] }) {
  return (
    <div className="mt-8 flex gap-2 flex-col">
      {groups.map((group) => (
        <GroupListItem key={group.id} group={group} />
      ))}
    </div>
  );
}

function GroupListItem({ group }: { group: Groups.Group }) {
  const navigate = useNavigate();
  const gotoGroupPage = () => navigate(`/groups/${group.id}`);

  return (
    <div
      className="px-4 py-3 rounded-lg bg-dark-3 hover:shadow-lg hover:bg-dark-4 transition-colors cursor-pointer"
      onClick={gotoGroupPage}
    >
      <div className="font-semibold text-xl">{group.name}</div>
      <div className="text-white-1/80 text-sm">{group.mission}</div>
    </div>
  );
}
