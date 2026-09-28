import React from "react";
import { createPortal } from "react-dom";
import { IconMinus, IconPlus, IconSettings } from "../../icons";
import { Menu, MenuActionItem, MenuSeparator } from "../../Menu";
import { useTipTapEditor } from "../EditorContext";
import { hasTableHeader } from "../extensions/Table";
import { ToolbarButton } from "./ToolbarButton";
import { TableActionPreview } from "./TableActionPreview";
import { insertionActions, canRunTableAction, type TableAction } from "./tableActions";
import { useTableControls } from "./useTableControls";

export function TableControls() {
  const editor = useTipTapEditor();
  const controls = useTableControls(editor);
  const { target, owner, menu, setMenu, closeMenu, preview, setPreview, run } = controls;
  const restoreFocus = React.useRef(true);
  const pressedContextItem = React.useRef<Element | null>(null);

  React.useEffect(() => {
    if (menu) restoreFocus.current = true;
    pressedContextItem.current = null;
  }, [menu]);
  if (!target || editor.isDestroyed || !editor.isEditable) return null;

  const events = (action: TableAction) => ({
    onPointerEnter: () => setPreview(action),
    onPointerLeave: () => setPreview(null),
    onFocus: () => setPreview(action),
    onBlur: () => setPreview(null),
  });
  const actionButton = (action: TableAction, label: string, icon: React.ReactNode) => (
    <ToolbarButton
      testId={`table-toolbar-${action}`}
      title={label}
      aria-label={label}
      tabIndex={0}
      className="!p-2 !text-content-dimmed"
      disabled={!canRunTableAction(editor, target, action)}
      {...events(action)}
      onClick={() => run(action)}
    >
      {icon}
    </ToolbarButton>
  );
  const actionItem = (action: TableAction, label: string) => (
    <MenuActionItem
      key={action}
      testId={`table-${action}`}
      danger={action.startsWith("delete")}
      disabled={!canRunTableAction(editor, target, action)}
      {...events(action)}
      onClick={() => run(action)}
    >
      {label}
    </MenuActionItem>
  );
  const menuItems = (context: boolean) => (
    <>
      {insertionActions.map(({ command, label }) => actionItem(command, label))}
      <MenuSeparator />
      {context ? (
        <>
          {actionItem("deleteRow", "Delete row")}
          {actionItem("deleteColumn", "Delete column")}
        </>
      ) : (
        <>
          {actionItem("toggleHeaderRow", hasTableHeader(target.node) ? "Remove header row" : "Add header row")}
          {actionItem("deleteTable", "Delete table")}
        </>
      )}
    </>
  );
  const contentProps = {
    "data-table-controls": owner,
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
    onInteractOutside: () => {
      restoreFocus.current = false;
    },
  };

  return (
    <>
      {createPortal(
        <div
          ref={controls.toolbar}
          data-table-controls={owner}
          role="group"
          aria-label="Table controls"
          className="rich-text-table-controls flex flex-wrap justify-end items-center gap-1 cursor-default"
          onPointerDown={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
              editor.view.focus();
            }
          }}
        >
          <div className="flex items-center rounded-md border border-surface-outline bg-surface-base">
            {actionButton("deleteRow", "Delete row", <IconMinus size={16} />)}
            <span className="text-xs tabular-nums text-content-dimmed whitespace-nowrap px-1">
              {target.rows} {target.rows === 1 ? "row" : "rows"}
            </span>
            {actionButton("addRowAfter", "Add row below", <IconPlus size={16} />)}
          </div>
          <div className="flex items-center rounded-md border border-surface-outline bg-surface-base">
            {actionButton("deleteColumn", "Delete column", <IconMinus size={16} />)}
            <span className="text-xs tabular-nums text-content-dimmed whitespace-nowrap px-1">
              {target.columns} {target.columns === 1 ? "column" : "columns"}
            </span>
            {actionButton("addColumnAfter", "Add column right", <IconPlus size={16} />)}
          </div>
          <Menu
            size="tiny"
            align="end"
            open={menu?.kind === "settings"}
            contentProps={contentProps}
            onOpenChange={(open) => {
              setMenu(open ? { kind: "settings" } : null);
              setPreview(null);
            }}
            onCloseAutoFocus={(event) => {
              // Preserve the editor's cursor without overriding an intentional outside click.
              event.preventDefault();
              if (restoreFocus.current && !editor.isDestroyed && editor.isEditable) editor.view.focus();
            }}
            customTrigger={
              <ToolbarButton
                testId="toolbar-button-table-settings"
                title="Table settings"
                aria-label="Table settings"
                tabIndex={0}
                className="!p-2 !text-content-dimmed"
              >
                <IconSettings size={16} />
              </ToolbarButton>
            }
          >
            {menuItems(false)}
          </Menu>
        </div>,
        target.slot,
      )}
      {menu?.kind === "context" && (
        <Menu
          size="tiny"
          align="start"
          open
          anchorPosition={menu}
          contentProps={{
            ...contentProps,
            "aria-label": "Cell actions",
            onPointerDownCapture: (event) => {
              pressedContextItem.current =
                event.button === 0 && !event.ctrlKey && event.target instanceof Element
                  ? event.target.closest('[role="menuitem"]')
                  : null;
            },
            onPointerUpCapture: (event) => {
              const pressedItem = pressedContextItem.current;
              pressedContextItem.current = null;
              // Radix can synthesize a click on release; don't select with the gesture that opened the menu.
              if (
                event.button !== 0 ||
                event.ctrlKey ||
                !(event.target instanceof Node) ||
                !pressedItem?.contains(event.target)
              ) {
                event.preventDefault();
                event.stopPropagation();
              }
            },
            onPointerCancelCapture: () => {
              pressedContextItem.current = null;
            },
          }}
          onOpenChange={(open) => {
            if (!open) closeMenu();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (restoreFocus.current && !editor.isDestroyed && editor.isEditable) editor.view.focus();
          }}
        >
          {menuItems(true)}
        </Menu>
      )}
      <TableActionPreview target={target} action={preview} />
    </>
  );
}
