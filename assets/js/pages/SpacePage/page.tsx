import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import MemberList from "./MemberList";

import { useLoadedData, useRefresh } from "./loader";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { Feed, useItemsQuery } from "@/features/Feed";
import { FilledButton } from "@/components/Button";

import { useJoinSpace } from "@/models/spaces";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <SpacePageNavigation space={space} activeTab="overview" />

          <div className="mt-12">
            <div className="font-medium flex items-center gap-2 justify-center mb-2">
              {React.createElement(Icons[space.icon!], { size: 48, className: space.color, strokeWidth: 1 })}
            </div>

            <div className="font-bold text-4xl text-center">{space.name}</div>

            <div className="text-center mt-1">
              <div className="">{space.mission}</div>
            </div>
          </div>

          <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="space-members">
            <MemberList space={space!} />
          </div>

          <JoinButton space={space} />

          <Paper.DimmedSection>
            <div className="uppercase text-xs font-semibold mb-2">Activity</div>
            <SpaceActivity space={space} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceActivity({ space }) {
  const { data, loading, error } = useItemsQuery("space", space.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="space-feed" page="space" />;
}

function JoinButton({ space }) {
  const refresh = useRefresh();
  const [join] = useJoinSpace();

  if (space.isMember) return null;

  const handleClick = async () => {
    await join({ spaceId: space.id });
    refresh();
  };

  return (
    <div className="flex justify-center mb-8">
      <FilledButton type="primary" size="sm" onClick={handleClick} testId="join-space-button">
        Join this Space
      </FilledButton>
    </div>
  );
}
