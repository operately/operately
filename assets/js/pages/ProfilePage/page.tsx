import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import { PageHeader } from "@/features/Profile/PageHeader";
import { PageNavigation } from "@/features/Profile/PageNavigation";
import { useLoadedData } from "./loader";
import { Colleagues } from "./Colleagues";
import { Feed, useItemsQuery } from "@/features/Feed";

export function Page() {
  const { person } = useLoadedData();

  return (
    <Pages.Page title={[person.fullName!, "Profile"]}>
      <Paper.Root>
        <PageNavigation />

        <Paper.Body>
          <PageHeader person={person} activeTab="about" />

          <div className="mt-4 flex flex-col divide-y divide-stroke-base">
            <Contact person={person} />
            <Colleagues person={person} />
          </div>

          <Paper.DimmedSection>
            <div className="mt-6">
              <div className="text-xs mt-6 mb-3 uppercase font-bold">{People.firstName(person)}'s Activity</div>
              <PersonFeedContent />
            </div>
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Contact({ person }: { person: People.Person }) {
  return (
    <div className="py-6">
      <div className="text-xs mb-2 uppercase font-bold">Contact</div>
      <div className="flex items-center gap-1 font-medium">
        <Icons.IconMail size={20} className="text-content-dimmed" />
        {person.email}
      </div>
    </div>
  );
}

function PersonFeedContent() {
  const { person } = useLoadedData();
  const { data, loading, error } = useItemsQuery("person", person.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="profile-feed" page="profile" />;
}
