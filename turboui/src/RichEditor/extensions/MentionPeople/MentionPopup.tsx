import { ReactRenderer } from "@tiptap/react";

import { MentionList } from "./MentionList";

type MentionPopupProps = Record<string, any>;

/**
 * @public
 * Declaring the MentionPopup class public to silence the knip dead code warning.
 */
export class MentionPopup {
  component: ReactRenderer | null;
  unmount: (() => void) | null;

  constructor() {
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

    this.unmount = props.mount(this.component.element);
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
    this.unmount?.();

    if (this.component !== null) {
      this.component.destroy();
    }

    this.unmount = null;
    this.component = null;
  }
}
