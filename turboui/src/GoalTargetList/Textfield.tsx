import React from "react";
import classNames from "../utils/classnames";

interface TextfieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  addonRight?: string;
}

export const Textfield = React.forwardRef<HTMLInputElement, TextfieldProps>((props, ref) => {
  const { label, error, className, addonRight, ...rest } = props;

  const cn = classNames(
    "focus:border-indigo-500 bg-transparent w-full border border-stroke-base rounded-lg py-1.5 px-3",
    className,
  );

  return (
    <div className="relative">
      {label && <label className="font-bold text-sm mb-1 block">{label}</label>}
      <input ref={ref} className={cn} {...rest} />
      {addonRight && <span className="absolute right-0 text-content-dimmed px-3 py-1.5 rounded">{addonRight}</span>}
      {error && <div className="text-red-500 text-xs mt-1 mb-1">{error}</div>}
    </div>
  );
});
