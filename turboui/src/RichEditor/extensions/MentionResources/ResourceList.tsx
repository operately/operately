import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { createTestId } from "../../../TestableElement";
import type { ResourceSearchFn, ResourceSuggestion } from ".";

type Props = {
  query: string;
  command: (resource: ResourceSuggestion) => void;
  search: ResourceSearchFn;
};

export const ResourceList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, Props>(
  ({ query, command, search }, ref) => {
    const { t } = useTranslation();
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
      search(query)
        .then((results) => {
          if (!active) return;
          setItems(results);
          setStatus("ready");
        })
        .catch(() => {
          if (active) setStatus("error");
        });

      return () => {
        active = false;
      };
    }, [query, search]);

    const currentItems = resultsForQuery === query ? items : [];
    const currentStatus = resultsForQuery === query ? status : query.trim().length < 2 ? "prompt" : "loading";

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
        className="flex flex-col border border-surface-outline rounded overflow-hidden bg-surface-base min-w-64 max-w-96"
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
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={`px-2 py-1.5 text-left hover:bg-brand-1 ${index === selectedIndex ? "bg-brand-1" : ""}`}
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
