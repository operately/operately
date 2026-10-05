import * as Pages from "@/components/Pages";
import { PageModule } from "@/routes/types";
import React from "react";
import { ErrorPage } from "turboui";
import { useOptionalPaths } from "@/routes/paths";

export default { name: "NotFoundPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = useOptionalPaths();

  return <ErrorPage status={404} homePath={paths?.homePath()} />;
}
