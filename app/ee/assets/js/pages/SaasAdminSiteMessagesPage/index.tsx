import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import {
  ConfirmDialog,
  IconEdit,
  IconPlus,
  IconTrash,
  Menu,
  MenuActionItem,
  parseContent,
  richContentToString,
  SecondaryButton,
} from "turboui";

import { SiteMessageModal } from "./SiteMessageModal";

interface LoaderResult {
  messages: AdminApi.SiteMessage[];
}

export const loader = async (): Promise<LoaderResult> => {
  const data = await AdminApi.listSiteMessages({});
  return { messages: data.messages ?? [] };
};

export function Page() {
  const { messages } = Pages.useLoadedData<LoaderResult>();
  const refresh = Pages.useRefresh();
  const [modalMessage, setModalMessage] = React.useState<AdminApi.SiteMessage | undefined>();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [messageToDelete, setMessageToDelete] = React.useState<AdminApi.SiteMessage | undefined>();
  const [deleteMessage] = AdminApi.useDeleteSiteMessage();

  const closeModal = () => {
    setModalMessage(undefined);
    setIsCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!messageToDelete?.id) return;

    await deleteMessage({ id: messageToDelete.id });
    setMessageToDelete(undefined);
    refresh();
  };

  return (
    <Pages.Page title="Site messages" testId="saas-admin-site-messages-page">
      <Paper.Root size="xlarge">
        <Paper.Navigation items={[{ to: "/admin", label: "Administration" }]} />
        <Paper.Body>
          <div className="flex items-start justify-between gap-4">
            <Paper.Header title="Site messages" />
            <SecondaryButton
              size="sm"
              icon={IconPlus}
              onClick={() => setIsCreateOpen(true)}
              testId="create-site-message-button"
            >
              Create message
            </SecondaryButton>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-content-accent">No site messages yet.</p>
              <p className="mt-2 text-sm text-content-subtle">Create a message to show a banner to company users.</p>
            </div>
          ) : (
            <MessageTable messages={messages} onEdit={setModalMessage} onDelete={setMessageToDelete} />
          )}
        </Paper.Body>
      </Paper.Root>

      {(isCreateOpen || modalMessage !== undefined) && (
        <SiteMessageModal
          key={modalMessage?.id ?? "create"}
          isOpen
          onClose={closeModal}
          onSuccess={refresh}
          message={modalMessage}
        />
      )}

      <ConfirmDialog
        isOpen={messageToDelete !== undefined}
        onCancel={() => setMessageToDelete(undefined)}
        onConfirm={handleDelete}
        title="Delete this message?"
        message="Users who haven't dismissed it will stop seeing it immediately."
        confirmText="Delete message"
        cancelText="Cancel"
        variant="danger"
        testId="delete-site-message-confirmation"
      />
    </Pages.Page>
  );
}

function MessageTable({
  messages,
  onEdit,
  onDelete,
}: {
  messages: AdminApi.SiteMessage[];
  onEdit: (message: AdminApi.SiteMessage) => void;
  onDelete: (message: AdminApi.SiteMessage) => void;
}) {
  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="2fr 1fr 0.75fr 1fr 1fr 0.5fr">
        <div>Title</div>
        <div>Audience</div>
        <div>Status</div>
        <div>Expires</div>
        <div>Created</div>
        <div className="text-right">Actions</div>
      </TableRow>

      {messages.map((message) => (
        <TableRow key={message.id} gridTemplateColumns="2fr 1fr 0.75fr 1fr 1fr 0.5fr">
          <div className="min-w-0">
            <div className="truncate font-medium">{message.title}</div>
            <div className="truncate text-xs text-content-subtle">
              {message.description ? richContentToString(parseContent(message.description)) : null}
            </div>
          </div>
          <div>{audienceLabel(message)}</div>
          <div>{message.active ? "Active" : "Inactive"}</div>
          <div>{message.expiresAt ? <FormattedTime time={message.expiresAt} format="long-date" /> : "Never"}</div>
          <div>{message.insertedAt ? <FormattedTime time={message.insertedAt} format="long-date" /> : null}</div>
          <div className="flex justify-end">
            <Menu>
              <MenuActionItem icon={IconEdit} onClick={() => onEdit(message)}>
                Edit
              </MenuActionItem>
              <MenuActionItem icon={IconTrash} onClick={() => onDelete(message)}>
                Delete
              </MenuActionItem>
            </Menu>
          </div>
        </TableRow>
      ))}
    </div>
  );
}

function audienceLabel(message: AdminApi.SiteMessage) {
  if (message.allCompanies) return "All companies";
  const count = message.companyIds?.length ?? 0;
  return count === 1 ? "1 company" : `${count} companies`;
}

function TableRow({
  header,
  children,
  gridTemplateColumns,
}: {
  header?: boolean;
  children: React.ReactNode;
  gridTemplateColumns: string;
}) {
  return (
    <div
      className={classNames("grid items-center gap-2 px-4 py-3", {
        "border-y border-stroke-base bg-surface-dimmed text-xs font-bold uppercase": header,
        "border-b border-stroke-base text-sm": !header,
        "-mx-4": true,
      })}
      style={{ gridTemplateColumns }}
    >
      {children}
    </div>
  );
}
