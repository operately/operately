import * as React from "react";
import { useTranslation } from "react-i18next";
import { Page } from "../Page";
import { IconEdit } from "../icons";
import { RenameCollectionModal } from "./RenameCollectionModal";

import { ContinueEditingDrafts, type ResourceHub, type ResourceHubNode } from "../ResourceHub";

import { SharedListPage, type SharedListPageProps } from "./SharedListPage";
import type { ResourceHubSearchFn, ResourceHubSearchProps } from "./types";

export namespace ResourceHubPage {
  export type SearchFn = ResourceHubSearchFn;
  export type SearchProps = ResourceHubSearchProps;

  export interface Props extends SharedListPageProps {
    resourceHub: ResourceHub;
    renameCollection?: (id: string, name: string) => Promise<void>;
    drafts: {
      nodes: ResourceHubNode[];
      draftsPath: string;
    };
  }
}

export function ResourceHubPage(props: ResourceHubPage.Props) {
  const { t } = useTranslation();
  const [showRenameForm, setShowRenameForm] = React.useState(false);
  const canRename = Boolean(
    props.renameCollection &&
    props.resourceHub.permissions?.canRenameHub &&
    props.resourceHub.space &&
    !props.resourceHub.project &&
    !props.resourceHub.goal,
  );
  const options: Page.Option[] = [
    {
      type: "action",
      icon: IconEdit,
      label: t("Rename"),
      onClick: () => setShowRenameForm(true),
      hidden: !canRename,
      testId: "rename-collection",
    },
  ];
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
      options={options}
      search={props.search}
      formattedTimePreferences={props.formattedTimePreferences}
      beforeList={<ContinueEditingDrafts drafts={props.drafts.nodes} draftsPath={props.drafts.draftsPath} />}
    >
      {showRenameForm && canRename && props.renameCollection && (
        <RenameCollectionModal
          resourceHub={props.resourceHub}
          onRename={props.renameCollection}
          onClose={() => setShowRenameForm(false)}
        />
      )}
    </SharedListPage>
  );
}
