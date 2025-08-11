import React from "react";
import classNames from "../../utils/classnames";

interface TextfieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  addonRight?: string;
  className?: string;
  textRight?: boolean;
  testId?: string;
  inputClassName?: string;
}

export const Textfield = React.forwardRef<HTMLInputElement, TextfieldProps>((props, ref) => {
  const { label, error, className, addonRight, inputClassName, testId, ...rest } = props;

  const cn = classNames(
    "flex items-center gap-1",
    "has-[:focus]:outline outline-indigo-600 bg-transparent",
    "w-full border border-stroke-base rounded-lg",
  );

  const inputCN = classNames("flex-1 py-1.5 bg-transparent", inputClassName, {
    "text-right": props.textRight,
    "px-3": !addonRight,
    "pl-3 pr-0.5": addonRight,
  });

  const addonCN = classNames("text-content-subtle py-1.5 pr-3");

  return (
    <div className={className}>
      {label && <label className="font-bold text-sm mb-1 block text-left">{label}</label>}
      <div className={cn}>
        <input ref={ref} className={inputCN} data-test-id={testId || "textfield"} {...rest} />
        {addonRight && <span className={addonCN}>{addonRight}</span>}
      </div>
      {error && <div className="text-red-500 text-xs mt-1 mb-1">{error}</div>}
    </div>
  );
});
