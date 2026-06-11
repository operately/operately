import * as React from "react";

import { Page } from "../Page";
import { IconEdit } from "../icons";
import { RenameFolderModal, type ResourceHubFolder } from "../ResourceHub";
import { SharedListPage, type SharedListPageProps } from "../ResourceHubPage/SharedListPage";

export namespace ResourceHubFolderPage {
  export interface Props extends SharedListPageProps {
    folder: ResourceHubFolder;
    renameFolder: {
      onRename: (id: string, name: string) => Promise<void>;
      onSave: () => void;
    };
  }
}

export function ResourceHubFolderPage(props: ResourceHubFolderPage.Props) {
  const [showRenameForm, setShowRenameForm] = React.useState(false);

  const toggleRenameForm = React.useCallback(() => {
    setShowRenameForm((current) => !current);
  }, []);

  const options = React.useMemo<Page.Option[]>(
    () => [
      {
        type: "action",
        icon: IconEdit,
        label: "Rename",
        onClick: toggleRenameForm,
        hidden: !props.folder.permissions?.canRenameFolder,
        testId: "rename-folder",
      },
    ],
    [props.folder.permissions?.canRenameFolder, toggleRenameForm],
  );

  return (
    <SharedListPage
      title={props.title}
      navigation={props.navigation}
      newFileModals={props.newFileModals}
      addFileWidgetProps={props.addFileWidgetProps}
      nodesListProps={props.nodesListProps}
      addFolderModalProps={props.addFolderModalProps}
      heading={props.folder.name ?? ""}
      permissions={props.folder.permissions}
      options={options}
    >
      <RenameFolderModal
        folder={props.folder}
        showForm={showRenameForm}
        toggleForm={toggleRenameForm}
        key={props.folder.name}
        onSave={props.renameFolder.onSave}
        forms={props.addFolderModalProps.forms}
        modal={props.addFolderModalProps.modal}
        onRename={props.renameFolder.onRename}
      />
    </SharedListPage>
  );
}
