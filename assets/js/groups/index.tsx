import React from "react";

import PageTitle from "./page_title";

export default function GroupsIndexPage({groups: groups}) {
  const groupCards = groups.map((group) => {
    return (
      <div key={group.id}>
        <a href={`/groups/${group.id}`}>{group.name}</a>
      </div>
    )
  });

  const buttons = (
    <a href="/groups/new">
      <button className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Group</button>
    </a>
  );

  return (
    <div>
      <PageTitle
        name="Groups"
        description="Manage teams, depeartmants and devisions in your company"
        buttons={buttons}
        />

      <div>
        {groupCards}
      </div>
    </div>
  );
}
