import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

import { useLoadedData } from "./loader";
import Avatar from "@/components/Avatar";
import { Feed, useItemsQuery } from "@/features/Feed";

export function Page() {
  const { person } = useLoadedData();

  return (
    <Pages.Page title={[person.fullName, "Profile"]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/people`}>People</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Header />
          <PersonFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { person } = useLoadedData();

  return (
    <div className="flex items-center gap-4">
      <Avatar person={person} size={72} />
      <div className="flex flex-col">
        <div className="text-xl font-bold">{person.fullName}</div>
        <div className="font-medium">{person.title}</div>
      </div>
    </div>
  );
}

function PersonFeed() {
  const { person } = useLoadedData();

  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">
        {People.firstName(person)}'s Activity
      </div>
      <PersonFeedContent />
    </Paper.DimmedSection>
  );
}

function PersonFeedContent() {
  const { person } = useLoadedData();
  const { data, loading, error } = useItemsQuery("person", person.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data.activities} testId="profile-feed" page="profile" />;
}
