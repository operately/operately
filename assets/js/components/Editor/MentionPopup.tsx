import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance, Props } from "tippy.js";

import MentionList from "./MentionList";

type PopupInstance = Instance<Props>[] | null;
type MentionPopupProps = Record<string, any>;

export default class MentionPopup {
  component: ReactRenderer | null;
  popup: PopupInstance | null;

  constructor() {
    this.component = null;
    this.popup = null;
  }

  onStart(props: MentionPopupProps) {
    this.component = new ReactRenderer(MentionList, {
      props,
      editor: props.editor,
    });

    if (!props.clientRect) {
      return;
    }

    this.popup = tippy("body", {
      getReferenceClientRect: props.clientRect,
      appendTo: () => document.body,
      content: this.component.element,
      showOnCreate: true,
      interactive: true,
      trigger: "manual",
      placement: "bottom-start",
    });
  }

  onUpdate(props: MentionPopupProps) {
    if (!this.component) return;
    if (!this.popup) return;

    this.component.updateProps(props);

    if (!props.clientRect) {
      return;
    }

    if (!this.popup[0]) {
      return;
    }

    this.popup[0].setProps({
      getReferenceClientRect: props.clientRect,
    });
  }

  onKeyDown(props: MentionPopupProps) {
    if (!this.component) return;
    if (!this.popup) return;

    if (props.event.key === "Escape") {
      if (!this.popup[0]) return;

      this.popup[0].hide();

      return true;
    }

    if (!this.component.ref) return;

    return this.component.ref?.onKeyDown(props);
  }

  onExit() {
    if (this.component !== null) {
      this.component.destroy();
    }

    if (this.popup !== null && this.popup[0]) {
      this.popup[0].destroy();
    }
  }
}
