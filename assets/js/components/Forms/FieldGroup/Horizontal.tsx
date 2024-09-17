import React from "react";
import { useLayoutOptions } from "./Context";
import { InputFieldProps } from "../FieldGroup";
import { match } from "ts-pattern";
import { ErrorMessage } from "../ErrorMessage";
import { Label } from "../Label";

export interface Options {
  ratio: "1:1" | "1:2" | "1:3" | "1:4" | "1:5" | "2:1" | "3:1" | "4:1" | "5:1";
  dividers: boolean;
}

const DEFAULT_OPTIONS: Options = {
  ratio: "1:3",
  dividers: false,
};

export function initializeOptions(options: Partial<Options>): Options {
  return { ...DEFAULT_OPTIONS, ...options };
}

export function Container({ children }: { children: React.ReactNode }) {
  const options = useLayoutOptions<Options>();
  const className = options.dividers ? "flex flex-col" : "flex flex-col gap-4";

  return <div className={className}>{children}</div>;
}

export function Input(props: InputFieldProps) {
  const options = useLayoutOptions<Options>();

  const label = props.label ? <Label field={props.field} label={props.label} icon={props.labelIcon} /> : null;
  const error = props.error ? <ErrorMessage error={props.error} /> : null;

  const [leftSize, rightSize] = match(options.ratio)
    .with("1:1", () => ["w-1/2", "w-1/2"])
    .with("1:2", () => ["w-1/3", "w-2/3"])
    .with("1:3", () => ["w-1/4", "w-3/4"])
    .with("1:4", () => ["w-1/5", "w-4/5"])
    .with("1:5", () => ["w-1/6", "w-5/6"])
    .with("2:1", () => ["w-2/3", "w-1/3"])
    .with("3:1", () => ["w-3/4", "w-1/4"])
    .with("4:1", () => ["w-4/5", "w-1/5"])
    .with("5:1", () => ["w-5/6", "w-1/6"])
    .run();

  const className = options.dividers ? "border-t last:border-b border-stroke-dimmed py-2.5" : "";

  return (
    <div className={className}>
      <div className="flex gap-4 items-center">
        <div className={leftSize + " shrink-0"}>{label}</div>
        <div className={rightSize + " flex flex-col gap-0.5 flex-1"}>{props.children}</div>
      </div>

      <div className={"flex gap-4 items-center" + (error ? "mt-0.5" : "")}>
        <div className={leftSize + " shrink-0"}></div>
        <div className={rightSize + " flex-1"}>{error}</div>
      </div>
    </div>
  );
}
