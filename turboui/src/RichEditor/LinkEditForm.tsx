import type { Editor } from "@tiptap/core";
import { find } from "linkifyjs";
import React from "react";
import { useTranslation } from "react-i18next";

import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorMessage } from "../Forms/ErrorMessage";
import { Input } from "../Forms/Input";
import { isValidURL } from "../utils/url";
import { useLinkState } from "./EditorContext";
import { isLinkShortcut } from "./components/editorKeyboard";
import { AUTO_LINK_SUPPRESSION_MARK } from "./extensions/Link/AutoLinkSuppression";

export function LinkEditForm({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useLinkState();
  const close = React.useCallback(() => setOpen(false), [setOpen]);
  if (!open || !editor) return null;

  return <OpenLinkEditForm editor={editor} close={close} />;
}

function OpenLinkEditForm({ editor, close }: { editor: Editor; close: () => void }) {
  const { t } = useTranslation();
  const [link, setLink] = React.useState<string>(() => editor.getAttributes("link").href ?? "");
  const [error, setError] = React.useState(false);
  const errorId = React.useId();
  const formRef = React.useRef<HTMLDivElement>(null);
  const isSelectionLink = editor.isActive("link");

  React.useEffect(() => {
    editor.commands.setFakeTextSelection();
    editor.on("focus", close);

    return () => {
      editor.off("focus", close);
      if (!editor.isDestroyed) editor.commands.unsetFakeTextSelection();
    };
  }, [editor, close]);

  React.useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const dismissOnOutsideClick = (event: MouseEvent) => {
      if (!event.composedPath().includes(form)) close();
    };

    form.ownerDocument.addEventListener("click", dismissOnOutsideClick);
    return () => form.ownerDocument.removeEventListener("click", dismissOnOutsideClick);
  }, [close]);

  const cancel = () => {
    editor.chain().unsetFakeTextSelection().focus(null, { scrollIntoView: false }).run();
    close();
  };

  const unlink = () => {
    editor
      .chain()
      .extendMarkRange("link")
      .unsetLink()
      .setMark(AUTO_LINK_SUPPRESSION_MARK)
      .unsetFakeTextSelection()
      .focus()
      .run();
    close();
  };

  const save = () => {
    const label = link.trim();
    const href = resolveLinkHref(label);
    if (!href) {
      setError(true);
      return;
    }

    const atCaret = editor.state.selection.empty;
    const suppressed = atCaret && editor.isActive(AUTO_LINK_SUPPRESSION_MARK);
    const chain = editor.chain();

    if (isSelectionLink) chain.extendMarkRange("link");
    if (suppressed) chain.extendMarkRange(AUTO_LINK_SUPPRESSION_MARK);

    chain.unsetMark(AUTO_LINK_SUPPRESSION_MARK).setLink({ href });
    if (atCaret && !isSelectionLink && !suppressed) chain.insertContent({ type: "text", text: label });

    chain.unsetFakeTextSelection().focus().run();
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape" || isLinkShortcut(event.nativeEvent)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") cancel();
    }
  };

  return (
    <div
      ref={formRef}
      className="border-b border-stroke-base p-1.5 flex flex-col gap-1"
      data-link-edit-form
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          type="text"
          className="text-sm"
          value={link}
          aria-label={t("URL")}
          aria-describedby={error ? errorId : undefined}
          placeholder={t("ex. https://example.com")}
          error={error}
          onChange={(event) => {
            setLink(event.target.value);
            setError(false);
          }}
          onEnter={(event) => {
            if (event.nativeEvent.isComposing) return;
            event.preventDefault();
            event.stopPropagation();
            save();
          }}
        />
        <PrimaryButton onClick={save} size="xxs">
          {isSelectionLink ? t("Save") : t("Add")}
        </PrimaryButton>
        <SecondaryButton onClick={isSelectionLink ? unlink : cancel} size="xxs">
          {isSelectionLink ? t("Unlink") : t("Cancel")}
        </SecondaryButton>
      </div>
      {error && <ErrorMessage error={t("Invalid link")} id={errorId} />}
    </div>
  );
}

function resolveLinkHref(value: string): string | null {
  if (isValidURL(value) || /^mailto:[^?\s]+(?:\?.*)?$/i.test(value)) return value;

  const [match] = find(value, "url", { defaultProtocol: "https" });
  if (match?.start === 0 && match.end === value.length && isValidURL(match.href)) return match.href;

  return null;
}
