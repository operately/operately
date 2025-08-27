import NotFoundPage from "@/pages/NotFoundPage";
import * as React from "react";

import { captureException } from "@sentry/react";
import { AxiosError } from "axios";
import { useRouteError, useRouteLoaderData } from "react-router-dom";
import { GhostButton } from "turboui";

import { usePaths } from "@/routes/paths";
import { SimpleNotFoundPage } from "@/components/SimpleNotFoundPage";
export default function ErrorPage() {
  const error = useRouteError() as AxiosError | null;

  if (error && error["status"] === 404) {
    return <NotFound404Page />;
  } else {
    return <ServerErrorPage />;
  }
}

function NotFound404Page() {
  const data = useRouteLoaderData("companyRoot") as { company: { id: string | null } } | null;

  // If we're not in a company route context, use the simple 404 page
  if (!data || !data.company) {
    return <SimpleNotFoundPage />;
  }

  // If we're in a company route context, use the full NotFoundPage
  return <NotFoundPage.Page />;
}

function ServerErrorPage() {
  const data = useRouteLoaderData("companyRoot") as { company: { id: string | null } } | null;
  const error = useRouteError() as AxiosError | null;

  React.useEffect(() => {
    console.error(error);
    captureException(error, { level: "fatal" });
  }, [error]);

  // Determine the home path based on context
  let homePath = "/";
  if (data && data.company) {
    try {
      const paths = usePaths();
      homePath = paths.homePath();
    } catch {
      // Fallback to root if usePaths fails
      homePath = "/";
    }
  }

  return (
    <div className="absolute inset-0 flex justify-center items-center gap-16">
      <div className="flex flex-col text-center -mt-64">
        <div className="font-extrabold" style={{ fontSize: "10rem" }}>
          500
        </div>
        <div className="text-3xl font-bold mt-4">Oops! Something went wrong.</div>
        <div className="text-lg font-medium my-4">An unexpected error has occurred.</div>

        <div className="flex w-full justify-center mt-4">
          <GhostButton linkTo={homePath} testId="back-to-lobby">
            Go back to Home
          </GhostButton>
        </div>

        <StackTrace />
      </div>
    </div>
  );
}

function StackTrace() {
  const error = useRouteError() as Error | null;
  const env = window.appConfig.environment;

  if (env !== "dev" && env !== "test") return null;

  return (
    <div className="mt-8 bg-surface-base text-left p-4">
      <div className="font-bold mb-4">Error Stack Trace</div>

      <pre className="text-sm font-mono whitespace-pre-wrap">{error!.stack}</pre>

      <div className="mt-4 text-sm">This error is visible only in dev and test environments.</div>
    </div>
  );
}
