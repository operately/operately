import NotFoundPage from "@/pages/NotFoundPage";
import * as React from "react";

import axios from "axios";
import { useRouteError } from "react-router";
import { ErrorPage as ErrorPageUI } from "turboui";

import { useOptionalPaths } from "@/routes/paths";

export default function ErrorPage() {
  const error = useRouteError();
  const status = axios.isAxiosError(error)
    ? (error.response?.status ?? error.status)
    : error && typeof error === "object" && "status" in error
      ? error.status
      : undefined;

  return status === 404 ? <NotFoundPage.Page /> : <ServerErrorPage status={status === 503 ? 503 : 500} />;
}

function ServerErrorPage({ status }: { status: 500 | 503 }) {
  const error = useRouteError() as Error | null;
  const paths = useOptionalPaths();
  const env = window.appConfig.environment;

  return (
    <ErrorPageUI
      status={status}
      homePath={paths?.homePath()}
      diagnostics={env === "dev" || env === "test" ? { stack: error?.stack } : undefined}
    />
  );
}
