import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import MemberList from "./MemberList";

import { useLoadedData, useRefresh } from "./loader";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { Feed, useItemsQuery } from "@/features/Feed";
import { FilledButton } from "@/components/Button";

import { useJoinSpaceMutation } from "@/models/groups";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="overview" />

          <div className="mt-12">
            <div className="font-medium flex items-center gap-2 justify-center mb-2">
              {React.createElement(Icons[group.icon], { size: 48, className: group.color, strokeWidth: 1 })}
            </div>

            <div className="font-bold text-4xl text-center">{group.name}</div>

            <div className="text-center mt-1">
              <div className="">{group.mission}</div>
            </div>
          </div>

          <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="group-members">
            <MemberList group={group} />
          </div>

          <JoinButton group={group} />

          <Paper.DimmedSection>
            <div className="uppercase text-xs font-semibold mb-2">Activity</div>
            <SpaceActivity space={group} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceActivity({ space }) {
  const { loadedAt } = useLoadedData();
  const { data, loading, error, refetch } = useItemsQuery("space", space.id);

  React.useEffect(() => {
    refetch();
  }, [loadedAt]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data.activities} testId="space-feed" page="space" />;
}

function JoinButton({ group }) {
  const refresh = useRefresh();

  const [join] = useJoinSpaceMutation({ onCompleted: refresh });

  if (group.isMember) return null;

  const handleClick = async () => {
    await join({ variables: { input: { spaceId: group.id } } });
  };

  return (
    <div className="flex justify-center mb-8">
      <FilledButton type="primary" size="sm" onClick={handleClick} testId="join-space-button">
        Join this Space
      </FilledButton>
    </div>
  );
}
