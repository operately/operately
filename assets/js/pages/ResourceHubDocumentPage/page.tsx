import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";

export function Page() {
  const { document } = useLoadedData();

  return (
    <Pages.Page title={document.name!}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Title />
          <Body />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { document } = useLoadedData();

  assertPresent(document.resourceHub, "resourceHub must be present in document");

  const name = document.parentFolder?.name || document.resourceHub.name;
  const path = document.parentFolder
    ? Paths.resourceHubFolderPath(document.parentFolder.id!)
    : Paths.resourceHubPath(document.resourceHub.id!);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={path}>{name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Title() {
  const { document } = useLoadedData();

  assertPresent(document.author, "author must be present in document");

  return (
    <div className="flex flex-col items-center">
      <Paper.Header title={document.name!} />
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={document.author} size="tiny" /> {document.author.fullName}
        </div>

        <TextSeparator />
        <FormattedTime time={document.insertedAt!} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Body() {
  const { document } = useLoadedData();

  return (
    <>
      <Spacer size={4} />
      <RichContent jsonContent={document.content!} className="text-md sm:text-lg" />
    </>
  );
}
