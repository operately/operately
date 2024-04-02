import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";

import { PageHeader } from "@/features/Profile/PageHeader";
import { PageNavigation } from "@/features/Profile/PageNavigation";

export function Page() {
  const { person } = useLoadedData();

  return (
    <Pages.Page title={[person.fullName, "Profile"]}>
      <Paper.Root>
        <PageNavigation />

        <Paper.Body>
          <PageHeader person={person} activeTab="about" />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
