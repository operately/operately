import * as React from "react";

import { captureException } from "@sentry/react";
import { AxiosError } from "axios";
import { useRouteError } from "react-router-dom";
import { GhostButton } from "turboui";

import { useHomePath } from "@/hooks/useHomePath";
import { ContextAwareNotFoundPage } from "@/components/ContextAwareNotFoundPage";

export default function ErrorPage() {
  const error = useRouteError() as AxiosError | null;

  if (error && error["status"] === 404) {
    return <ContextAwareNotFoundPage />;
  } else {
    return <ServerErrorPage />;
  }
}

function ServerErrorPage() {
  const error = useRouteError() as AxiosError | null;
  const homePath = useHomePath();

  React.useEffect(() => {
    console.error(error);
    captureException(error, { level: "fatal" });
  }, [error]);

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
