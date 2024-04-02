import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

import { useLoadedData } from "./loader";
import { Feed, useItemsQuery } from "@/features/Feed";

import { PageHeader } from "@/features/Profile/PageHeader";
import { PageNavigation } from "@/features/Profile/PageNavigation";

export function Page() {
  const { person } = useLoadedData();

  return (
    <Pages.Page title={[person.fullName, "Profile"]}>
      <Paper.Root>
        <PageNavigation />

        <Paper.Body>
          <PageHeader person={person} activeTab="activity" />
          <PersonFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
