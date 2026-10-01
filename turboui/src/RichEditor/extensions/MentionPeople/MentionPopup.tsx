import type { EditorView } from "@tiptap/pm/view";
import { ReactRenderer } from "@tiptap/react";

import { MentionList } from "./MentionList";

type MentionPopupProps = Record<string, any>;

/**
 * Must sit above SlideIn / Modal overlays (Tailwind z-50) so @mention
 * suggestions remain visible when editing task descriptions in a slide-in.
 */
export const MENTION_POPUP_Z_INDEX = 100;

/**
 * @public
 * Declaring the MentionPopup class public to silence the knip dead code warning.
 */
export class MentionPopup {
  component: ReactRenderer | null;
  unmount: (() => void) | null;

  cleanupOutsideClick: (() => void) | null = null;

  constructor(private dismiss?: (view: EditorView) => void) {
    this.component = null;
    this.unmount = null;
  }

  onStart(props: MentionPopupProps) {
    this.component = new ReactRenderer(MentionList, {
      props,
      editor: props.editor,
    });

    if (!props.clientRect) {
      return;
    }

    this.component.element.style.zIndex = String(MENTION_POPUP_Z_INDEX);
    this.unmount = props.mount(this.component.element);

    if (this.dismiss) {
      const element = this.component.element;
      const editorElement = props.editor.view.dom as HTMLElement;
      const onOutsideClick = (event: PointerEvent) => {
        // The full path includes popup/editor elements hidden by Shadow DOM retargeting.
        const path = event.composedPath();
        if (!path.includes(element) && !path.includes(editorElement)) this.dismiss?.(props.editor.view);
      };
      element.ownerDocument.addEventListener("pointerdown", onOutsideClick, true);
      this.cleanupOutsideClick = () => element.ownerDocument.removeEventListener("pointerdown", onOutsideClick, true);
    }
  }

  onUpdate(props: MentionPopupProps) {
    if (!this.component) return;

    this.component.updateProps(props);
  }

  onKeyDown(props: MentionPopupProps) {
    if (!this.component) return;

    if (props.event.key === "Escape") {
      this.unmount?.();
      return true;
    }

    if (!this.component.ref) return;

    return (this.component.ref as any).onKeyDown(props);
  }

  onExit() {
    this.cleanupOutsideClick?.();
    this.cleanupOutsideClick = null;
    this.unmount?.();

    if (this.component !== null) {
      this.component.destroy();
    }

    this.unmount = null;
    this.component = null;
  }
}
