import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";

export function Page() {
  const { file } = useLoadedData();

  return (
    <Pages.Page title={file.name!}>
      <Paper.Root>
        <Paper.Body>
          <Paper.Header title={file.name!} layout="title-left-actions-right" />

          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { file } = useLoadedData();

  if (file.type?.includes("image")) return <Image />;

  return <></>;
}

function Image() {
  const { file } = useLoadedData();

  return (
    <div>
      <img src={file.url!} />
    </div>
  );
}
