import * as React from "react";

import { Link } from "../Link";
import type { DraftNodesListProps } from "../ResourceHub/DraftNodesList";
import { Page } from "../Page";
import { DraftNodesList } from "../ResourceHub";

export namespace ResourceHubDraftsPage {
  export interface Props extends DraftNodesListProps {
    title: Page.Props["title"];
    navigation: NonNullable<Page.Props["navigation"]>;
    resourceHubPath: string;
    actions?: React.ReactNode;
  }
}

export function ResourceHubDraftsPage(props: ResourceHubDraftsPage.Props) {
  return (
    <Page title={props.title} size="large" navigation={props.navigation}>
      <div className="min-h-[75vh] px-4 sm:px-12 py-10">
        <DraftsHeader actions={props.actions} />
        {props.nodes.length === 0 ? (
          <div className="text-center py-12" data-test-id="drafts-empty">
            <p>You don’t have any drafts in these Docs & Files.</p>
            <Link to={props.resourceHubPath} className="mt-3 inline-block">
              Back to Docs & Files
            </Link>
          </div>
        ) : (
          <DraftNodesList {...props} />
        )}
      </div>
    </Page>
  );
}

function DraftsHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <div className="mb-6 -mx-4 sm:-mx-12 -mt-10 flex items-center justify-between border-b border-stroke-base px-4 sm:px-8 pt-5 pb-4">
      <div className="w-[30%]">{actions}</div>
      <div className="w-[50%] flex-1 text-center">
        <div className="text-content-accent text-lg font-extrabold md:text-2xl">Your Drafts</div>
      </div>
      <div className="w-[30%]" />
    </div>
  );
}
