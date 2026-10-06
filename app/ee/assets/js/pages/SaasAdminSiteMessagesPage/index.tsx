import { useTranslation } from "react-i18next";
import i18n, { tn } from "@/i18n";
import { useDeleteSiteMessage, useRefreshSiteMessages } from "@/ee/models/siteMessageLifecycle";
import { useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import classNames from "classnames";
import {
  ConfirmDialog,
  FormattedTime,
  IconEdit,
  IconPlus,
  IconTrash,
  Menu,
  MenuActionItem,
  parseContent,
  richContentToString,
  SecondaryButton,
} from "turboui";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

import { SiteMessageModal } from "./SiteMessageModal";

export { loader } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { messages } = useLoadedData();
  const refresh = useRefreshSiteMessages();
  const [modalMessage, setModalMessage] = React.useState<AdminApi.SiteMessage | undefined>();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [messageToDelete, setMessageToDelete] = React.useState<AdminApi.SiteMessage | undefined>();
  const { mutateAsync: deleteMessage } = useDeleteSiteMessage();

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
    <Pages.Page title={t("Site messages")} testId="saas-admin-site-messages-page">
      <Paper.Root size="xlarge">
        <Paper.Navigation items={[{ to: "/admin", label: t("Administration") }]} />
        <Paper.Body>
          <div className="flex items-start justify-between gap-4">
            <Paper.Header title={t("Site messages")} />
            <SecondaryButton
              size="sm"
              icon={IconPlus}
              onClick={() => setIsCreateOpen(true)}
              testId="create-site-message-button"
            >
              {t("Create message")}
            </SecondaryButton>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-content-accent">{t("No site messages yet.")}</p>
              <p className="mt-2 text-sm text-content-subtle">
                {t("Create a message to show a banner to company users.")}
              </p>
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
        title={t("Delete this message?")}
        message={t("Users who haven't dismissed it will stop seeing it immediately.")}
        confirmText={t("Delete message")}
        cancelText={t("Cancel")}
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
  const { t } = useTranslation();
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="2fr 1fr 0.75fr 1fr 1fr 0.5fr">
        <div>{t("Title")}</div>
        <div>{t("Audience")}</div>
        <div>{t("Status")}</div>
        <div>{t("Expires")}</div>
        <div>{t("Created")}</div>
        <div className="text-right">{t("Actions")}</div>
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
          <div>{message.active ? t("Active") : t("Inactive")}</div>
          <div>
            {message.expiresAt ? (
              <FormattedTime {...formattedTimePreferences} time={message.expiresAt} format="long-date" />
            ) : (
              t("Never")
            )}
          </div>
          <div>
            {message.insertedAt ? (
              <FormattedTime {...formattedTimePreferences} time={message.insertedAt} format="long-date" />
            ) : null}
          </div>
          <div className="flex justify-end">
            <Menu>
              <MenuActionItem icon={IconEdit} onClick={() => onEdit(message)}>
                {t("Edit")}
              </MenuActionItem>
              <MenuActionItem icon={IconTrash} onClick={() => onDelete(message)}>
                {t("Delete")}
              </MenuActionItem>
            </Menu>
          </div>
        </TableRow>
      ))}
    </div>
  );
}

function audienceLabel(message: AdminApi.SiteMessage) {
  if (message.allCompanies) return i18n.t("All companies");
  const count = message.companyIds?.length ?? 0;
  return tn("1 company", "{{count}} companies", count);
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
