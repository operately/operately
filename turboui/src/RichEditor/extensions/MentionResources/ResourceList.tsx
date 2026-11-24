import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import { createTestId } from "../../../TestableElement";
import type { ResourceSearchFn, ResourceSuggestion } from ".";

type Props = {
  query: string;
  editor?: Editor;
  command: (resource: ResourceSuggestion) => void;
  search: ResourceSearchFn;
};

export const ResourceList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, Props>(
  ({ query, command, search, editor }, ref) => {
    const { t } = useTranslation();
    const listId = useId();
    const listRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<ResourceSuggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [status, setStatus] = useState<"prompt" | "loading" | "ready" | "error">("prompt");
    const [resultsForQuery, setResultsForQuery] = useState(query);

    useEffect(() => {
      let active = true;
      setResultsForQuery(query);
      setItems([]);
      setSelectedIndex(0);
      if (query.trim().length < 2) {
        setStatus("prompt");
        return () => {
          active = false;
        };
      }

      setStatus("loading");
      const timeout = setTimeout(() => {
        search(query)
          .then((results) => {
            if (!active) return;
            setItems(results);
            setStatus("ready");
          })
          .catch(() => {
            if (active) setStatus("error");
          });
      }, 300);

      return () => {
        clearTimeout(timeout);
        active = false;
      };
    }, [query, search]);

    const currentItems = resultsForQuery === query ? items : [];
    const currentStatus = resultsForQuery === query ? status : query.trim().length < 2 ? "prompt" : "loading";

    const selected = currentItems[selectedIndex];
    const optionId = (item: ResourceSuggestion) => `${listId}-${item.type}-${item.id}`;
    const activeOptionId = currentStatus === "ready" && selected ? optionId(selected) : undefined;

    useEffect(() => {
      if (!activeOptionId) return;
      const option = listRef.current?.querySelector('[aria-selected="true"]');
      option?.scrollIntoView?.({ block: "nearest" });
    }, [activeOptionId]);

    useEffect(() => {
      if (!editor) return;
      const element = editor.view.dom;
      const attributes = {
        "aria-autocomplete": "list",
        "aria-controls": listId,
        "aria-haspopup": "listbox",
        "aria-activedescendant": activeOptionId,
      };
      const previous = Object.keys(attributes).map((name) => [name, element.getAttribute(name)] as const);
      Object.entries(attributes).forEach(([name, value]) => {
        if (value) element.setAttribute(name, value);
        else element.removeAttribute(name);
      });
      return () => {
        previous.forEach(([name, value]) => {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        });
      };
    }, [editor, listId, activeOptionId]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (currentStatus !== "ready" || currentItems.length === 0) return false;
          if (event.key === "ArrowDown") {
            setSelectedIndex((index) => (index + 1) % currentItems.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            setSelectedIndex((index) => (index + currentItems.length - 1) % currentItems.length);
            return true;
          }
          if (event.key === "Enter") {
            const selected = currentItems[selectedIndex];
            if (selected) command(selected);
            return true;
          }
          return false;
        },
      }),
      [currentItems, selectedIndex, currentStatus, command],
    );

    const message =
      currentStatus === "prompt"
        ? t("Type at least two characters to search for work.")
        : currentStatus === "loading"
          ? t("Searching work…")
          : currentStatus === "error"
            ? t("Could not search work. Try again.")
            : currentItems.length === 0
              ? t("No matching work.")
              : null;

    return (
      <div
        ref={listRef}
        id={listId}
        className="flex flex-col border border-surface-outline rounded overflow-y-auto bg-surface-base min-w-64 max-w-96"
        style={{ maxHeight: "min(24rem, var(--resource-picker-available-height, calc(100dvh - 16px)))" }}
        data-test-id="resource-suggestions"
        role={currentStatus === "ready" && currentItems.length > 0 ? "listbox" : undefined}
        aria-label={currentStatus === "ready" && currentItems.length > 0 ? t("Search results") : undefined}
      >
        {message && (
          <div className="px-2 py-2 text-sm text-content-subtle" role="status">
            {message}
          </div>
        )}
        {currentStatus === "ready" &&
          currentItems.map((item, index) => (
            <button
              key={`${item.type}-${item.id}`}
              id={optionId(item)}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={`shrink-0 px-2 py-1.5 text-left hover:bg-brand-1 ${index === selectedIndex ? "bg-brand-1" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command(item)}
              data-test-id={createTestId("mention-resource", item.type, item.id)}
            >
              <span className="block text-sm text-content-accent">{item.title}</span>
              <span className="block text-xs text-content-subtle">
                {item.type === "goal" ? t("Goal") : item.type === "project" ? t("Project") : t("Task")}
                {item.context ? ` · ${item.context}` : ""}
              </span>
            </button>
          ))}
      </div>
    );
  },
);
