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

          <div className="mt-6">
            <div className="text-xs mt-6 mb-3 uppercase font-bold">{People.firstName(person)}'s Activity</div>
            <PersonFeedContent />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PersonFeedContent() {
  const { person } = useLoadedData();
  const { data, loading, error } = useItemsQuery("person", person.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data.activities} testId="profile-feed" page="profile" />;
}
