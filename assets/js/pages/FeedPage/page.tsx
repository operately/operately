import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Feed, useItemsQuery } from "@/features/Feed";
import { useLoadedData } from "./loader";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={"The Feed"}>
      <Paper.Root size="large">
        <Paper.Body>
          <div className="text-content-accent text-4xl font-extrabold">The Feed</div>
          <div className="mb-8">All the latest activity in {company.name}</div>
          <CompanyFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CompanyFeed() {
  const { company } = useLoadedData();
  const { data, loading, error } = useItemsQuery("company", company.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data.activities} testId="company-feed" page="company" />;
}
