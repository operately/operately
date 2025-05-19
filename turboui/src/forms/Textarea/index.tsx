import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import classNames from "../../utils/classnames";

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { label, error, className, ...rest } = props;

  const cn = classNames(
    "flex items-center gap-1",
    "has-[:focus]:outline outline-indigo-600 bg-transparent",
    "w-full border border-stroke-base rounded-lg",
    "px-3 py-1.5 bg-transparent",
  );

  return (
    <div className={className}>
      {label && <label className="font-bold text-sm mb-1 block">{label}</label>}
      <div className={cn}>
        <TextareaAutosize ref={ref} className="w-full border-0 p-0 focus:ring-0" style={{ resize: "none" }} {...rest} />
      </div>
      {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
    </div>
  );
});
