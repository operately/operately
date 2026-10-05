import NotFoundPage from "@/pages/NotFoundPage";
import * as React from "react";

import { captureException } from "@sentry/react";
import axios, { AxiosError } from "axios";
import { useRouteError } from "react-router";
import { ErrorPage as ErrorPageUI } from "turboui";

import { useOptionalPaths } from "@/routes/paths";

export default function ErrorPage() {
  const error = useRouteError() as AxiosError | null;

  return error?.status === 404 ? <NotFoundPage.Page /> : <ServerErrorPage />;
}

function ServerErrorPage() {
  const error = useRouteError() as Error | null;
  const paths = useOptionalPaths();
  const env = window.appConfig.environment;

  React.useEffect(() => {
    if (!error) return;

    console.error(error);
    if (!axios.isAxiosError(error)) {
      captureException(error, { level: "fatal" });
    }
  }, [error]);

  return (
    <ErrorPageUI
      status={500}
      homePath={paths?.homePath()}
      diagnostics={env === "dev" || env === "test" ? { stack: error?.stack } : undefined}
    />
  );
}
