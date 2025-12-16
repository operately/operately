import React, { useEffect, useRef, useState } from "react";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace TextField {
  export interface Props {
    text: string;
    onChange: (newText: string) => void;
    className?: string;
    readonly?: boolean;
    placeholder?: string;
    trimBeforeSave?: boolean;
    testId?: string;
    variant?: "inline" | "form-field";
    label?: string;
    error?: string;
    autofocus?: boolean;
    inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
    multiline?: boolean;
  }

  export interface State {
    className: string;
    testId: string;
    trimBeforeSave: boolean;
    label: string | undefined;
    error?: string;
    readonly: boolean;
    placeholder: string;
    autofocus: boolean;

    currentText: string;
    setCurrentText: (newText: string) => void;
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;

    save: () => void;
    cancel: () => void;
    onChange: (newText: string) => void;
  }
}

function useTextFieldState(props: TextField.Props): TextField.State {
  const [currentText, setCurrentText] = useState(props.text);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCurrentText(props.text);
  }, [props.text]);

  const save = () => {
    let textToSave = props.trimBeforeSave ? currentText.trim() : currentText;

    setCurrentText(textToSave);
    setIsEditing(false);

    if (textToSave !== props.text) {
      props.onChange(textToSave);
    }
  };

  const cancel = () => {
    setCurrentText(props.text); // revert buffer
    setIsEditing(false);
  };

  return {
    className: props.className || "",
    testId: props.testId || "text-field",
    trimBeforeSave: props.trimBeforeSave || false,
    label: props.label,
    error: props.error,
    readonly: props.readonly || false,
    placeholder: props.placeholder || "",
    currentText,
    setCurrentText,
    isEditing,
    setIsEditing,
    save,
    cancel,
    autofocus: !!props.autofocus,
    onChange: props.onChange,
  };
}

export function TextField(props: TextField.Props) {
  const state = useTextFieldState(props);
  if (props.variant === "form-field") {
    return <FormFieldTextField {...state} inputRef={props.inputRef} />;
  } else {
    return <InlineTextField {...state} inputRef={props.inputRef} multiline={!!props.multiline} />;
  }
}

function assignRef(
  ref: React.Ref<HTMLInputElement | HTMLTextAreaElement> | undefined,
  value: HTMLInputElement | HTMLTextAreaElement | null,
) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else {
    try {
      (ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = value;
    } catch {
      // ignore assignment errors for read-only refs
    }
  }
}

function FormFieldTextField(state: TextField.State & { inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement> }) {
  const localRef = useRef<HTMLInputElement | null>(null);

  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    assignRef(state.inputRef, node);
  };

  useEffect(() => {
    if (state.autofocus && localRef.current) {
      localRef.current.focus();
    }
  }, [state.autofocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      state.cancel();
    } else if (e.key === "Enter") {
      state.save();
    }
  };

  const outerClass = classNames(
    "cursor-text relative w-full border rounded-lg px-2 py-1.5 bg-surface-base",
    "focus-within:outline outline-indigo-600 bg-transparent",
    state.error ? "border-red-500 outline-red-500" : "border-surface-outline",
  );

  return (
    <div className={state.className}>
      {state.label && <label className="font-bold text-sm mb-1 block text-left">{state.label}</label>}
      <div className={outerClass} data-test-id={state.testId}>
        <input
          data-test-id={createTestId(state.testId, "input")}
          ref={setRef}
          type="text"
          value={state.currentText}
          onChange={(e) => {
            state.setCurrentText(e.target.value);
          }}
          onBlur={(e) => {
            state.save();
            // Trigger external onChange with final value on blur
            state.onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={"w-full border-none outline-none bg-transparent text-sm px-0 py-0 " + state.className}
          placeholder={state.placeholder}
          readOnly={state.readonly}
          style={{
            minWidth: "0",
            maxWidth: "100%",
            boxSizing: "border-box",
            font: "inherit",
          }}
        />
      </div>
      {state.error && <div className="text-red-500 text-xs mt-1 mb-1">{state.error}</div>}
    </div>
  );
}

function InlineTextField(
  state: TextField.State & { inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>; multiline: boolean },
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hiddenSpanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    assignRef(state.inputRef, state.multiline ? textareaRef.current : inputRef.current);
  }, [state.inputRef, state.multiline]);

  const adjustInputWidth = () => {
    if (hiddenSpanRef.current && inputRef.current) {
      const textToMeasure = state.currentText || state.placeholder || " ";
      hiddenSpanRef.current.textContent = textToMeasure;
      const textWidth = hiddenSpanRef.current.offsetWidth;
      const desiredWidth = Math.max(textWidth + 10, 50);
      inputRef.current.style.width = `${desiredWidth}px`;
      inputRef.current.style.maxWidth = "100%";
    }
  };

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (!state.isEditing) return;

    if (state.multiline) {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      autoResizeTextarea();
    } else {
      if (!inputRef.current) return;
      inputRef.current.focus();
      adjustInputWidth();
    }
  }, [state.isEditing, state.multiline]);

  useEffect(() => {
    if (!state.isEditing) return;
    if (!state.multiline) return;

    autoResizeTextarea();
  }, [state.currentText, state.isEditing, state.multiline]);

  useEffect(() => {
    if (!state.isEditing) return;
    if (!state.multiline) return;

    const el = textareaRef.current;
    if (!el) return;

    if (document.activeElement === el) {
      const length = el.value.length;
      try {
        el.setSelectionRange(length, length);
      } catch {
        // Ignore if setSelectionRange is not supported
      }
    }
  }, [state.isEditing, state.multiline]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      state.cancel();
    } else if (e.key === "Enter") {
      if (state.multiline) {
        e.preventDefault();
      }
      state.save();
    }
  };

  const outerClass = classNames(
    state.multiline ? "cursor-text relative block w-full" : "cursor-text relative inline-block",
    {
      "hover:bg-surface-dimmed": !state.isEditing && !state.readonly && !state.multiline,
      "bg-surface-dimmed": state.isEditing && !state.multiline,
      "rounded px-1 py-0.5 -mx-1 -my-0.5": !state.multiline,
    },
  );

  const startEditing = () => {
    if (!state.readonly) {
      state.setIsEditing(true);
    }
  };

  const wrapperClass = state.multiline ? "min-w-0" : state.className;

  return (
    <div className={wrapperClass}>
      {state.label && <label className="font-bold text-sm mb-1 block text-left">{state.label}</label>}
      <div className={outerClass} onClick={startEditing} data-test-id={state.testId}>
        <span
          ref={hiddenSpanRef}
          className={state.className}
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            font: "inherit",
          }}
        >
          {state.isEditing ? state.currentText || state.placeholder || " " : state.currentText || " "}
        </span>

        {state.isEditing ? (
          state.multiline ? (
            <textarea
              data-test-id={createTestId(state.testId, "input")}
              ref={textareaRef}
              value={state.currentText}
              onChange={(e) => state.setCurrentText(e.target.value)}
              onBlur={state.save}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={1}
              wrap="soft"
              className={
                state.className +
                " w-full bg-transparent border-none outline-none focus:ring-0 resize-none overflow-hidden break-words p-0 m-0 align-top"
              }
              placeholder={state.placeholder}
              readOnly={state.readonly}
              style={{ display: "block" }}
            />
          ) : (
            <input
              data-test-id={createTestId(state.testId, "input")}
              ref={inputRef}
              type="text"
              value={state.currentText}
              onChange={(e) => state.setCurrentText(e.target.value)}
              onBlur={state.save}
              onKeyDown={handleKeyDown}
              className={"ring-0 focus:ring-0 " + state.className}
              placeholder={state.placeholder}
              readOnly={state.readonly}
              style={{
                border: "none",
                background: "none",
                outline: "none",
                padding: 0,
                margin: 0,
                font: "inherit",
                minWidth: "50px",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            />
          )
        ) : (
          <span
            className={state.className}
            style={{
              color: !state.currentText && state.placeholder ? "var(--color-content-subtle)" : undefined,
              whiteSpace: state.multiline ? "pre-wrap" : undefined,
              overflowWrap: state.multiline ? "anywhere" : undefined,
            }}
          >
            {state.currentText || state.placeholder || " "}
          </span>
        )}
      </div>
    </div>
  );
}
