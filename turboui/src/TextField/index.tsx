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
  }
}

export function TextField(props: TextField.Props) {
  if (props.variant === "form-field") {
    return <FormFieldTextField {...props} />;
  } else {
    return <InlineTextField {...props} />;
  }
}

function FormFieldTextField({
  text,
  onChange,
  className,
  placeholder,
  trimBeforeSave = false,
  testId = "text-field",
  label,
  readonly = false,
}: TextField.Props) {
  const [currentText, setCurrentText] = useState(text);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  const handleBlur = () => {
    let textToSave = trimBeforeSave ? currentText.trim() : currentText;
    if (textToSave !== text) {
      onChange(textToSave);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCurrentText(text); // revert buffer
    } else if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur(); // trigger onBlur
    }
  };

  const outerClass = classNames(
    "cursor-text relative w-full border border-surface-outline rounded-lg px-2 py-1.5 bg-surface-base",
    "has-[:focus]:outline outline-indigo-600 bg-transparent",
    className,
  );

  return (
    <div className={className}>
      {label && <label className="font-bold text-sm mb-1 block text-left">{label}</label>}
      <div className={outerClass} data-test-id={testId}>
        <input
          data-test-id={createTestId(testId, "input")}
          type="text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={"w-full border-none outline-none bg-transparent text-sm px-0 py-0 " + className}
          placeholder={placeholder}
          readOnly={readonly}
          style={{
            minWidth: "0",
            maxWidth: "100%",
            boxSizing: "border-box",
            font: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function InlineTextField({
  text,
  onChange,
  className,
  readonly = false,
  placeholder,
  trimBeforeSave = false,
  testId = "text-field",
  label,
}: TextField.Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hiddenSpanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      adjustInputWidth();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      adjustInputWidth();
    }
  }, [currentText, isEditing]);

  const adjustInputWidth = () => {
    if (hiddenSpanRef.current && inputRef.current) {
      const textToMeasure = currentText || placeholder || " ";
      hiddenSpanRef.current.textContent = textToMeasure;
      const textWidth = hiddenSpanRef.current.offsetWidth;
      const desiredWidth = Math.max(textWidth + 10, 50);
      inputRef.current.style.width = `${desiredWidth}px`;
      inputRef.current.style.maxWidth = "100%";
    }
  };

  const handleBlur = () => {
    let textToSave = trimBeforeSave ? currentText.trim() : currentText;
    if (textToSave !== text) {
      onChange(textToSave);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCurrentText(text); // revert buffer
      setIsEditing(false);
    } else if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur(); // trigger onBlur
    }
  };

  const outerClass = classNames(
    "cursor-text relative inline-block",
    {
      "hover:bg-surface-dimmed": !isEditing && !readonly,
      "bg-surface-dimmed": isEditing,
      "rounded px-1 py-0.5 -mx-1 -my-0.5": true,
    },
    className,
  );

  const startEditing = () => {
    if (!readonly) {
      setIsEditing(true);
    }
  };

  return (
    <div className={className}>
      {label && <label className="font-bold text-sm mb-1 block text-left">{label}</label>}
      <div className={outerClass} onClick={startEditing} data-test-id={testId}>
        <span
          ref={hiddenSpanRef}
          className={className}
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            font: "inherit",
          }}
        >
          {isEditing ? currentText || placeholder || " " : currentText || " "}
        </span>
        {isEditing ? (
          <input
            data-test-id={createTestId(testId, "input")}
            ref={inputRef}
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={"ring-0 focus:ring-0 " + className}
            placeholder={placeholder}
            readOnly={readonly}
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
        ) : (
          <span
            className={className}
            style={{ color: !currentText && placeholder ? "var(--color-content-subtle)" : undefined }}
          >
            {currentText || placeholder || " "}
          </span>
        )}
      </div>
    </div>
  );
}
