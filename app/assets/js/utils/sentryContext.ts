import * as Sentry from "@sentry/react";

export function configureSentryUser() {
  const accountId = window.appConfig?.account?.id;
  if (accountId == null) return;

  Sentry.setUser({ id: String(accountId) });
}
