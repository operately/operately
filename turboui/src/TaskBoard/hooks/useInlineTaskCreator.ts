import React from "react";
import hotkeys from "hotkeys-js";
import { InlineTaskCreatorHandle } from "../components/InlineTaskCreator";

export interface UseInlineTaskCreatorOptions {
  hotkey?: string; // default: 'c'
  requireHover?: boolean; // default: true
}

export function useInlineTaskCreator(options: UseInlineTaskCreatorOptions = {}) {
  const { hotkey = "c", requireHover = true } = options;

  const [open, setOpen] = React.useState(false);
  const creatorRef = React.useRef<InlineTaskCreatorHandle | null>(null);
  const isHoveredRef = React.useRef(false);
  const requireHoverRef = React.useRef(requireHover);

  React.useEffect(() => {
    requireHoverRef.current = requireHover;
    if (requireHover) {
      isHoveredRef.current = false;
    } else {
      isHoveredRef.current = true;
    }
  }, [requireHover]);

  const focusCreator = React.useCallback(() => {
    creatorRef.current?.focus();
  }, []);

  const openCreator = React.useCallback(() => {
    setOpen(true);
    setTimeout(() => focusCreator(), 0);
  }, [focusCreator]);

  const closeCreator = React.useCallback(() => setOpen(false), []);

  const hoverBind = React.useMemo(() => {
    const enter = () => {
      isHoveredRef.current = true;
    };

    const leave = () => {
      isHoveredRef.current = requireHoverRef.current ? false : true;
    };

    return { onMouseEnter: enter, onMouseLeave: leave };
  }, []);

  React.useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      const target = evt.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable = !!target && (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isEditable) return;
      if (requireHoverRef.current && !isHoveredRef.current) return;

      evt.preventDefault();
      // Stop other handlers from also reacting to this key
      try {
        // KeyboardEvent extends Event and supports stopImmediatePropagation in modern browsers
        (evt as Event).stopImmediatePropagation();
      } catch {
        evt.stopPropagation();
      }

      openCreator();
    };

    hotkeys(hotkey, handler);
    return () => hotkeys.unbind(hotkey, handler);
  }, [hotkey, openCreator, requireHover]);

  return { open, openCreator, closeCreator, focusCreator, creatorRef, hoverBind } as const;
}
