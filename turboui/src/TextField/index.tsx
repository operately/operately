import React, { useEffect, useRef, useState } from "react";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace TextField {
  export interface Props {
    text: string;
    onSave: (newText: string) => Promise<boolean>;

    className?: string;
    readonly?: boolean;
    placeholder?: string;
    trimBeforeSave?: boolean;
    testId?: string;
    variant?: "inline" | "form-field";
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
  onSave,
  className,
  placeholder,
  trimBeforeSave = false,
  testId = "text-field",
}: TextField.Props) {
  const [currentText, setCurrentText] = useState(text);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  const handleSave = (newText: string) => {
    let textToSave = trimBeforeSave ? newText.trim() : newText;
    if (textToSave !== text) {
      onSave(textToSave).then((success) => {
        if (!success) {
          setCurrentText(text);
        }
      });
    }
    setCurrentText(textToSave);
  };

  const handleCancel = () => {
    setCurrentText(text);
  };

  const handleBlur = () => handleSave(currentText);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter") {
      handleSave(currentText);
    }
  };

  const outerClass = classNames(
    "cursor-text relative w-full border border-surface-outline rounded-lg px-2 py-1.5 bg-surface-base",
    "has-[:focus]:outline outline-indigo-600 bg-transparent",
    className,
  );

  return (
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
        style={{
          minWidth: "0",
          maxWidth: "100%",
          boxSizing: "border-box",
          font: "inherit",
        }}
      />
    </div>
  );
}

function InlineTextField({
  text,
  onSave,
  className,
  readonly = false,
  placeholder,
  trimBeforeSave = false,
  testId = "text-field",
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

  const handleSave = (newText: string) => {
    let textToSave = trimBeforeSave ? newText.trim() : newText;
    if (textToSave !== text) {
      onSave(textToSave).then((success) => {
        if (!success) {
          setCurrentText(text);
        }
      });
    }
    setIsEditing(false);
    setCurrentText(textToSave);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentText(text);
  };

  const handleBlur = () => handleSave(currentText);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter") {
      handleSave(currentText);
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
  );
}
