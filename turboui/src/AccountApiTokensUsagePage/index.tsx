import React from "react";

import { CopyToClipboard } from "../CopyToClipboard";
import { Page } from "../Page";

export namespace AccountApiTokensUsagePage {
  export interface Props {
    homePath: string;
    securityPath: string;
    apiTokensPath: string;
    baseUrl: string;
    externalBasePath: string;
  }
}

export function AccountApiTokensUsagePage(props: AccountApiTokensUsagePage.Props) {
  const navigation = React.useMemo(
    () => [
      { to: props.homePath, label: "Home" },
      { to: props.securityPath, label: "Password & Security" },
      { to: props.apiTokensPath, label: "API Tokens" },
    ],
    [props.apiTokensPath, props.homePath, props.securityPath],
  );

  const querySnippet = `curl -X GET "${props.baseUrl}${props.externalBasePath}/get_account" \\
  -H "Authorization: Bearer <token>"`;

  const mutationSnippet = `curl -X POST "${props.baseUrl}${props.externalBasePath}/update_profile" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"full_name":"Updated Name"}'`;

  return (
    <Page title="API Usage Instructions" size="small" navigation={navigation} testId="account-api-tokens-usage-page">
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">API Usage Instructions</h1>
          <p className="text-sm text-content-dimmed mt-2">Use these values when calling the external Operately API.</p>
        </header>

        <section className="mt-8 space-y-4">
          <CopyableField label="Base Path" value={props.externalBasePath} testId="copy-base-path" />
          <CopyableField label="Authorization Header" value="Authorization: Bearer <token>" testId="copy-auth-header" />
          <CopyableField label="API Base URL" value={`${props.baseUrl}${props.externalBasePath}`} testId="copy-api-base-url" />
        </section>

        <section className="mt-8 space-y-4">
          <CopyableSnippet title="Query Example (GET)" code={querySnippet} testId="copy-query-snippet" />
          <CopyableSnippet title="Mutation Example (POST)" code={mutationSnippet} testId="copy-mutation-snippet" />

          <div className="text-sm text-content-dimmed" data-test-id="api-token-usage-note">
            Read-only tokens are limited to queries. Full-access tokens can execute both queries and mutations.
          </div>
        </section>
      </div>
    </Page>
  );
}

function CopyableField({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-md border border-stroke-base p-3">
      <div className="text-xs uppercase tracking-wide text-content-dimmed">{label}</div>

      <div className="mt-1 flex items-start gap-2">
        <code className="block text-sm font-mono break-all flex-1">{value}</code>
        <CopyToClipboard text={value} size={18} testId={testId} />
      </div>
    </div>
  );
}

function CopyableSnippet({ title, code, testId }: { title: string; code: string; testId: string }) {
  return (
    <div className="rounded-md border border-stroke-base bg-surface-dimmed p-4">
      <div className="font-semibold mb-2">{title}</div>

      <div className="flex items-start gap-2">
        <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap bg-surface-base border border-stroke-base rounded-md p-3 overflow-x-auto flex-1">
          {code}
        </pre>

        <CopyToClipboard text={code} size={18} testId={testId} />
      </div>
    </div>
  );
}

export default AccountApiTokensUsagePage;
