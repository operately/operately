import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router";

import { applyLanguage } from "@/i18n";
import { routeLanguageQueryOptions } from "@/i18n/routeLanguageQuery";

/** Language for routes that render outside the company layout, including its error boundary. */
export function RouteLanguageProvider({
  children,
  accountOnly = false,
}: React.PropsWithChildren<{ accountOnly?: boolean }>) {
  const location = useLocation();
  const params = useParams();
  const companyId = accountOnly ? undefined : params.companyId;
  const options = React.useMemo(() => routeLanguageQueryOptions(companyId, location.key), [companyId, location.key]);
  const query = useQuery(options);
  const language = query.isError ? "en" : query.data?.language;

  return <LanguageBoundary language={query.isFetchedAfterMount ? language : undefined}>{children}</LanguageBoundary>;
}

function LanguageBoundary({ language, children }: React.PropsWithChildren<{ language?: string }>) {
  const [appliedLanguage, setAppliedLanguage] = React.useState<string>();

  React.useLayoutEffect(() => {
    if (!language) return;

    let active = true;
    void applyLanguage(language).then(() => {
      if (active) setAppliedLanguage(language);
    });

    return () => {
      active = false;
    };
  }, [language]);

  const ready = language !== undefined && language === appliedLanguage;

  // Wait before the initial mount; thereafter hide stale copy without discarding page state.
  return (
    <div hidden={!ready} style={ready ? { display: "contents" } : undefined}>
      {appliedLanguage !== undefined ? children : null}
    </div>
  );
}
