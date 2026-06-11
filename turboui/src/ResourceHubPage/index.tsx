import * as React from "react";

import { ContinueEditingDrafts, type ResourceHub, type ResourceHubNode } from "../ResourceHub";

import { SharedListPage, type SharedListPageProps } from "./SharedListPage";

export namespace ResourceHubPage {
  export interface Props extends SharedListPageProps {
    resourceHub: ResourceHub;
    drafts: {
      nodes: ResourceHubNode[];
      draftsPath: string;
      getDraftEditPath: (node: ResourceHubNode) => string | undefined;
    };
  }
}

export function ResourceHubPage(props: ResourceHubPage.Props) {
  return (
    <SharedListPage
      title={props.title}
      navigation={props.navigation}
      newFileModals={props.newFileModals}
      addFileWidgetProps={props.addFileWidgetProps}
      nodesListProps={props.nodesListProps}
      addFolderModalProps={props.addFolderModalProps}
      heading={props.resourceHub.name ?? ""}
      permissions={props.resourceHub.permissions}
      beforeList={
        <ContinueEditingDrafts
          drafts={props.drafts.nodes}
          draftsPath={props.drafts.draftsPath}
          getDraftEditPath={props.drafts.getDraftEditPath}
          getNodePath={props.nodesListProps.getNodePath}
        />
      }
    />
  );
}
