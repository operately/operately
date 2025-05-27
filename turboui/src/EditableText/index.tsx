import React, { useEffect, useRef, useState } from "react";
import classNames from "../utils/classnames";

type EditableTextProps = {
  text: string;
  onSave: (newText: string) => Promise<boolean>;
  className?: string;
  readonly?: boolean;
  placeholder?: string;
  trimBeforeSave?: boolean;
};

const EditableText: React.FC<EditableTextProps> = ({
  text,
  onSave,
  className,
  readonly = false,
  placeholder,
  trimBeforeSave = false,
}) => {
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
      // Use the longer of currentText or placeholder for width calculation
      const textToMeasure = currentText || placeholder || " ";
      hiddenSpanRef.current.textContent = textToMeasure;
      const textWidth = hiddenSpanRef.current.offsetWidth;
      const desiredWidth = Math.max(textWidth + 10, 50); // Add padding and minimum width

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
    setCurrentText(text); // Revert to original text
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
    "relative inline-block",
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
    <div className={outerClass} onClick={startEditing}>
      {/* Hidden span to measure text width */}
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
};

export default EditableText;
