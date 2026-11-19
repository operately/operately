import React from "react";
import { useTranslation } from "react-i18next";
import { GhostButton } from "../Button";

export namespace ErrorPage {
  export interface Props {
    status: 404 | 500 | 503;
    homePath?: string;
    diagnostics?: { stack?: string };
  }
}

export function ErrorPage({ status, homePath, diagnostics }: ErrorPage.Props) {
  const { t } = useTranslation();
  const { title, description } = {
    404: {
      title: t("Page Not Found"),
      description: t("Sorry, we couldn't find that page you were looking for."),
    },
    500: {
      title: t("Oops! Something went wrong."),
      description: t("An unexpected error has occurred."),
    },
    503: {
      title: t("Temporarily unavailable"),
      description: t("We can't load this page right now. Please try again."),
    },
  }[status];

  return (
    <main
      className="absolute inset-0 flex justify-center items-center gap-16"
      data-test-id="error-page"
      data-status={status}
    >
      <div className={`flex flex-col text-center min-w-0 max-w-full px-4 ${status === 503 ? "sm:-mt-64" : "-mt-64"}`}>
        <div className="font-extrabold" style={{ fontSize: "10rem" }}>
          {status}
        </div>
        <h1 className="text-3xl font-bold mt-4">{title}</h1>
        <p className="text-lg font-medium my-4">{description}</p>

        <div className="flex w-full justify-center mt-4">
          <GhostButton linkTo={homePath ?? "/"} testId="back-to-lobby">
            {homePath ? t("Go back to Home") : t("Go back to Lobby")}
          </GhostButton>
        </div>

        {diagnostics && (
          <div className="mt-8 bg-surface-base text-left p-4">
            <div className="font-bold mb-4">{t("Error Stack Trace")}</div>
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">{diagnostics.stack}</pre>
            <div className="mt-4 text-sm">{t("This error is visible only in dev and test environments.")}</div>
          </div>
        )}
      </div>
    </main>
  );
}
