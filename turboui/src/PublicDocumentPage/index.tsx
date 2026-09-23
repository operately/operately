import React from "react";
import type { PublicDocument } from "../ApiTypes";
import { DocumentPage } from "../DocumentPage";
import type { FormattedTimePreferences } from "../FormattedTime";
import { Page } from "../Page";
import { DivLink } from "../Link";
import { OperatelyLogo } from "../Logo";

const mentionedPersonLookup = async () => null;

export namespace PublicDocumentPage {
  export interface Props {
    document?: PublicDocument;
    loading?: boolean;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

export function PublicDocumentPage({ document, loading, formattedTimePreferences }: PublicDocumentPage.Props) {
  if (!document) {
    return (
      <Page
        title={loading ? "Loading document" : "Document unavailable"}
        testId={loading ? "public-document-loading" : "public-document-unavailable"}
      >
        <div className="px-8 py-12 text-center">
          <h1 className="text-xl font-bold">{loading ? "Loading document…" : "Document unavailable"}</h1>
          {!loading && (
            <p className="mt-3 text-content-dimmed">This link may have been disabled or the document removed.</p>
          )}
        </div>
      </Page>
    );
  }

  return (
    <>
      <DocumentPage
        pageTitle={document.name}
        title={document.name}
        author={null}
        state="published"
        publishedAt={document.publishedAt}
        modifiedAt={document.updatedAt}
        formattedTimePreferences={formattedTimePreferences}
        content={document.content}
        mentionedPersonLookup={mentionedPersonLookup}
        testId="public-document-page"
        hideDraftActions
        hideReactions
        hideComments
        hideSubscriptions
        hideCopyModal
        hideDeleteModal
      />
      <footer className="flex justify-center px-4 py-6">
        <DivLink
          to="https://operately.com"
          external
          testId="public-document-attribution"
          className="inline-flex items-center gap-2 text-xs text-content-dimmed hover:text-content-base transition-colors"
        >
          <span aria-hidden="true">
            <OperatelyLogo width="16px" height="16px" />
          </span>
          <span>Shared with Operately</span>
        </DivLink>
      </footer>
    </>
  );
}
