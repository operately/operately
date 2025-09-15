import React from "react";
import hotkeys from "hotkeys-js";
import { InlineTaskCreatorHandle } from "../components/InlineTaskCreator";

export interface UseInlineTaskCreatorOptions {
  hotkey?: string; // default: 'c'
}

export function useInlineTaskCreator(options: UseInlineTaskCreatorOptions = {}) {
  const { hotkey = "c" } = options;

  const [open, setOpen] = React.useState(false);
  const creatorRef = React.useRef<InlineTaskCreatorHandle | null>(null);
  const isHoveredRef = React.useRef(false);

  const focusCreator = React.useCallback(() => {
    creatorRef.current?.focus();
  }, []);

  const openCreator = React.useCallback(() => {
    setOpen(true);
    setTimeout(() => focusCreator(), 0);
  }, [focusCreator]);

  const closeCreator = React.useCallback(() => setOpen(false), []);

  const hoverBind = React.useMemo(
    () => ({
      onMouseEnter: () => (isHoveredRef.current = true),
      onMouseLeave: () => (isHoveredRef.current = false),
    }),
    [],
  );

  React.useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      const target = evt.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable = !!target && (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isEditable) return;
      if (!isHoveredRef.current) return;

      evt.preventDefault();
      // @ts-ignore - optional API
      if (typeof evt.stopImmediatePropagation === "function") evt.stopImmediatePropagation();
      else evt.stopPropagation();

      openCreator();
    };

    hotkeys(hotkey, handler);
    return () => hotkeys.unbind(hotkey, handler);
  }, [hotkey, openCreator]);

  return { open, openCreator, closeCreator, focusCreator, creatorRef, hoverBind } as const;
}

