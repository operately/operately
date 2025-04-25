import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import classNames from "../utils/classnames";

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { label, error, className, ...rest } = props;

  const cn = classNames(
    "focus:border-indigo-500 bg-transparent w-full border border-stroke-base rounded-lg py-1.5 px-3",
    className,
  );

  return (
    <div>
      {label && <label className="font-bold text-sm mb-1 block">{label}</label>}
      <TextareaAutosize ref={ref} className={cn} style={{ resize: "none" }} {...rest} />
      {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
    </div>
  );
});
