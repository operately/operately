import React from "react";
import { useTranslation } from "react-i18next";
import type { ResourceHubSummary, TaskBoardSummary } from "../ApiTypes";
import { ActionLink } from "../Link";
import { IconPlus } from "../icons";
import { ConfirmDialog } from "../ConfirmDialog";
import * as Forms from "../Forms";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { Tooltip } from "../Tooltip";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { DragHandle, DropIndicator, useSortableItem, useSortableList } from "../utils/PragmaticDragAndDrop";

export type ToolKind = "board" | "hub";
export type ToolAction =
  | { type: "create"; kind: ToolKind; name: string }
  | { type: "rename"; kind: ToolKind; id: string; name: string }
  | { type: "reorder"; kind: ToolKind; ids: string[] }
  | { type: "archive" | "restore" | "setDefault"; kind: "board"; id: string }
  | { type: "delete"; kind: "hub"; id: string };

export interface ToolManagementProps {
  boards: TaskBoardSummary[];
  hubs: ResourceHubSummary[];
  canEdit: boolean;
  onAction: (action: ToolAction) => Promise<boolean>;
}

type Item = ResourceHubSummary | TaskBoardSummary;
type Editing = { kind: ToolKind; item?: Item };
type Confirmation = { type: "archive" | "delete"; item: Item };

export function ToolManagement(
  props: ToolManagementProps & {
    kind: ToolKind;
    render?: (content: React.ReactNode, createAction: React.ReactNode) => React.ReactNode;
  },
) {
  const { t } = useTranslation();
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [pending, setPending] = React.useState(false);
  const busy = React.useRef(false);
  const activeBoards = React.useMemo(() => props.boards.filter((b) => !b.archivedAt), [props.boards]);
  const [previewOrder, setPreviewOrder] = React.useState<Item[] | null>(null);
  const items = previewOrder ?? (props.kind === "board" ? activeBoards : props.hubs);
  const containerId = React.useId();
  const archivedBoards = props.boards.filter((b) => b.archivedAt);

  const perform = async (action: ToolAction) => {
    if (busy.current) return false;

    busy.current = true;
    setPending(true);

    try {
      return await props.onAction(action);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  const reorder = async (itemId: string, newIndex: number) => {
    if (!props.canEdit || busy.current) return;

    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0 || index === newIndex || newIndex < 0 || newIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);

    if (!moved) return;
    reordered.splice(newIndex, 0, moved);
    setPreviewOrder(reordered);

    try {
      await perform({ type: "reorder", kind: props.kind, ids: reordered.map((item) => item.id) });
    } finally {
      setPreviewOrder(null);
    }
  };

  useSortableList(
    React.useMemo(() => items.map((item, index) => ({ id: item.id, index, containerId })), [items, containerId]),
    reorder,
  );

  const listProps = {
    kind: props.kind,
    canEdit: props.canEdit,
    pending,
    containerId,
    onReorder: reorder,
    onEdit: setEditing,
    onConfirm: setConfirmation,
    onAction: perform,
  };

  const createLabel = props.kind === "board" ? t("New board") : t("New Resource Hub");
  const createAction =
    props.canEdit && items.length > 0 ? (
      <Tooltip content={createLabel} size="sm">
        <span className="inline-flex">
          <UnstyledButton
            ariaLabel={createLabel}
            className="flex items-center justify-center size-8 rounded-md text-content-dimmed hover:text-content-base hover:bg-surface-dimmed focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-1"
            onClick={() => setEditing({ kind: props.kind })}
            disabled={pending}
            testId={`create-${props.kind}`}
          >
            <IconPlus size={18} aria-hidden />
          </UnstyledButton>
        </span>
      </Tooltip>
    ) : null;

  const content = (
    <div data-test-id={`${props.kind}-management`}>
      {(items.length > 0 || props.canEdit) && (
        <>
          {items.length > 0 && <ToolList {...listProps} items={items} />}
          {props.canEdit && items.length === 0 && (
            <div className="py-2 pl-12 pr-3">
              <ActionLink
                underline="hover"
                className="inline-flex items-center gap-1 py-1 text-sm font-medium"
                onClick={() => setEditing({ kind: props.kind })}
                disabled={pending}
                testId={`create-${props.kind}`}
              >
                <IconPlus size={16} aria-hidden />
                {createLabel}
              </ActionLink>
            </div>
          )}
        </>
      )}
      {props.kind === "board" && archivedBoards.length > 0 && (
        <details className="mt-3" data-test-id="archived-boards-section">
          <summary className="cursor-pointer text-sm font-semibold text-content-dimmed py-2">
            {t("Archived boards")}
          </summary>
          <ToolList {...listProps} items={archivedBoards} archived />
        </details>
      )}
      {editing && (
        <NameForm
          editing={editing}
          pending={pending}
          onClose={() => {
            if (!busy.current) setEditing(null);
          }}
          onSubmit={perform}
        />
      )}
      {confirmation && (
        <ConfirmDialog
          isOpen
          title={
            confirmation.type === "archive"
              ? t("Archive {{name}}?", { name: confirmation.item.name })
              : t("Delete {{name}}?", { name: confirmation.item.name })
          }
          message={
            confirmation.type === "archive"
              ? t(
                  "This board will be hidden from the space. Its tasks will remain readable, and you can restore it here.",
                )
              : t(
                  "Only empty Resource Hubs can be deleted. Remove all documents, drafts, files, links, and folders first.",
                )
          }
          confirmText={confirmation.type === "archive" ? t("Archive") : t("Delete")}
          variant={confirmation.type === "delete" ? "danger" : "default"}
          confirming={pending}
          onCancel={() => {
            if (!busy.current) setConfirmation(null);
          }}
          onConfirm={async () => {
            const action: ToolAction =
              confirmation.type === "archive"
                ? { type: "archive", kind: "board", id: confirmation.item.id }
                : { type: "delete", kind: "hub", id: confirmation.item.id };
            if (await perform(action)) setConfirmation(null);
          }}
          testId="confirm-tool-action"
        />
      )}
    </div>
  );

  return props.render ? (
    props.render(content, createAction)
  ) : (
    <>
      {createAction}
      {content}
    </>
  );
}

function ToolList({
  kind,
  items,
  archived = false,
  canEdit,
  pending,
  containerId,
  onReorder,
  onEdit,
  onConfirm,
  onAction,
}: {
  kind: ToolKind;
  items: Item[];
  archived?: boolean;
  canEdit: boolean;
  pending: boolean;
  containerId: string;
  onReorder: (id: string, index: number) => Promise<void>;
  onEdit: (editing: Editing) => void;
  onConfirm: (confirmation: Confirmation) => void;
  onAction: (action: ToolAction) => Promise<boolean>;
}) {
  const { t } = useTranslation();

  return (
    <div className="divide-y divide-stroke-dimmed" data-test-id={archived ? "archived-boards" : `${kind}-list`}>
      {items.map((item, index) => (
        <SortableToolRow
          key={item.id}
          item={item}
          index={index}
          containerId={containerId}
          canReorder={canEdit && !archived && items.length > 1}
          pending={pending}
          onReorder={onReorder}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-1">
            <span className="text-sm font-medium min-w-0 break-words">{item.name}</span>
            {item.isDefault && (
              <span
                className="text-xs text-content-dimmed bg-surface-dimmed rounded px-2 py-0.5 shrink-0"
                data-test-id="default-tool"
              >
                {t("Default")}
              </span>
            )}
          </div>
          {canEdit && (
            <Menu
              size="medium"
              testId={`tool-menu-${item.id}`}
              ariaLabel={t("Actions for {{name}}", { name: item.name })}
              readonly={pending}
            >
              {!archived && (
                <MenuActionItem onClick={() => onEdit({ kind, item })} testId="rename-tool">
                  {t("Rename")}
                </MenuActionItem>
              )}
              {kind === "board" && !archived && !item.isDefault && (
                <MenuActionItem
                  onClick={() => void onAction({ type: "setDefault", kind, id: item.id })}
                  testId="set-default-tool"
                >
                  {t("Set as default")}
                </MenuActionItem>
              )}
              {kind === "board" && !archived && !item.isDefault && (
                <MenuActionItem onClick={() => onConfirm({ type: "archive", item })} testId="archive-tool">
                  {t("Archive")}
                </MenuActionItem>
              )}
              {kind === "board" && archived && (
                <MenuActionItem
                  onClick={() => void onAction({ type: "restore", kind, id: item.id })}
                  testId="restore-tool"
                >
                  {t("Restore")}
                </MenuActionItem>
              )}
              {kind === "hub" && !item.isDefault && (
                <MenuActionItem onClick={() => onConfirm({ type: "delete", item })} testId="delete-tool" danger>
                  {t("Delete")}
                </MenuActionItem>
              )}
            </Menu>
          )}
        </SortableToolRow>
      ))}
    </div>
  );
}

function SortableToolRow({
  item,
  index,
  containerId,
  canReorder,
  pending,
  onReorder,
  children,
}: {
  item: Item;
  index: number;
  containerId: string;
  canReorder: boolean;
  pending: boolean;
  onReorder: (id: string, index: number) => Promise<void>;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem<HTMLDivElement>({
    itemId: item.id,
    index,
    containerId,
    scope: containerId,
    disabled: !canReorder || pending,
  });

  return (
    <div
      ref={ref}
      data-test-id={`tool-instance-${item.id}`}
      className={`group relative flex items-center gap-3 px-0 py-1.5 min-h-11 min-w-0 ${isDragging ? "opacity-50" : ""}`}
    >
      {canReorder && (
        <span
          className="w-6 shrink-0"
          ref={dragHandleRef as React.RefObject<HTMLSpanElement>}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            void onReorder(item.id, index + (event.key === "ArrowUp" ? -1 : 1));
          }}
        >
          <UnstyledButton
            ariaLabel={t("Reorder {{name}}", { name: item.name })}
            className="flex items-center p-1 cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-1"
            disabled={pending}
            testId={`drag-tool-${item.id}`}
          >
            <DragHandle isDragging={isDragging} className="opacity-100" />
          </UnstyledButton>
        </span>
      )}
      {children}
      {closestEdge && !isDragging && <DropIndicator edge={closestEdge} />}
    </div>
  );
}

function NameForm({
  editing,
  onClose,
  onSubmit,
  pending,
}: {
  editing: Editing;
  onClose: () => void;
  onSubmit: (action: ToolAction) => Promise<boolean>;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const form = Forms.useForm({
    fields: { name: editing.item?.name ?? "" },
    validate: (addError) => {
      if (!form.values.name.trim()) addError("name", t("Name is required"));
    },
    cancel: onClose,
    submit: async () => {
      const name = form.values.name.trim();
      const action: ToolAction = editing.item
        ? { type: "rename", kind: editing.kind, id: editing.item.id, name }
        : { type: "create", kind: editing.kind, name };
      if (await onSubmit(action)) onClose();
    },
  });
  const title =
    editing.kind === "board"
      ? editing.item
        ? t("Rename board")
        : t("New board")
      : editing.item
        ? t("Rename Resource Hub")
        : t("New Resource Hub");
  return (
    <Modal isOpen title={title} onClose={onClose} size="small" testId="tool-name-modal">
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput field="name" label={t("Name")} autoFocus testId="tool-name" maxLength={255} />
        </Forms.FieldGroup>
        <Forms.Submit
          saveText={editing.item ? t("Save") : t("Create")}
          disabled={pending}
          cancelDisabled={pending}
          testId="save-tool-name"
        />
      </Forms.Form>
    </Modal>
  );
}
