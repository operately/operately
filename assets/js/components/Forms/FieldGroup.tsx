import React from "react";

import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { match } from "ts-pattern";

//
// A field group is a container for form fields. It can either lay out its children
// horizontally or vertically.
//
// In horizontal layout, the label and input are placed side by side, e.g.:
//
//   Label: [ Input ]
//          Error message
//
//   Label: [ Input ]
//          Error message
//
// In vertical layout, the label, input, and error message are stacked on top of each other, e.g.:
//
//   Label
//   [ Input ]
//   Error message
//
//   Label
//   [ Input ]
//   Error message
//
// In grid layout, the label, input, and error message are stacked on top of each other, e.g.:
//
//  Label:         Label:         Label:
//  [ Input ]      [ Input ]      [ Input ]
//

type LayoutDirection = "horizontal" | "vertical" | "grid";

interface FieldGroupConfig {
  layout: LayoutDirection;
  dividers?: boolean;
}

const FieldGroupContext = React.createContext<FieldGroupConfig | null>(null);

interface FieldGroupProps {
  layout?: LayoutDirection;
  gridColumns?: number;
  children: React.ReactNode;
  dividers?: boolean;
}

export function FieldGroup({ layout, children, gridColumns, dividers }: FieldGroupProps) {
  const config = {
    layout: layout || "vertical",
    dividers: dividers || false,
  };

  if (layout === "grid" && !gridColumns) {
    throw new Error("FieldGroup with grid layout must specify the number of columns");
  }

  return (
    <FieldGroupContext.Provider value={config}>
      {match(config.layout)
        .with("vertical", () => <VerticalFieldGroup>{children}</VerticalFieldGroup>)
        .with("horizontal", () => <HorizontalFieldGroup>{children}</HorizontalFieldGroup>)
        .with("grid", () => <GridFieldGroup columns={gridColumns!}>{children}</GridFieldGroup>)
        .exhaustive()}
    </FieldGroupContext.Provider>
  );
}

function VerticalFieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

function HorizontalFieldGroup({ children }: { children: React.ReactNode }) {
  const context = React.useContext(FieldGroupContext);
  const className = context?.dividers ? "flex flex-col" : "flex flex-col gap-4";

  return <div className={className}>{children}</div>;
}

function GridFieldGroup({ children, columns }: { children: React.ReactNode; columns: number }) {
  const style = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
  };

  return (
    <div className="grid grid-cols-2 gap-4" style={style}>
      {children}
    </div>
  );
}

interface InputFieldProps {
  field: string;
  children: React.ReactNode;

  hidden?: boolean;
  label?: string;
  error?: string;
}

export function InputField(props: InputFieldProps) {
  if (props.hidden) return null;

  const config = React.useContext(FieldGroupContext);
  if (!config) throw new Error("FieldGroupItem must be used within a FieldGroup component");

  return match(config.layout)
    .with("vertical", () => <VerticalFieldGroupInput {...props} />)
    .with("horizontal", () => <HorizontalFieldGroupInput {...props} />)
    .with("grid", () => <GridFieldGroupInput {...props} />)
    .exhaustive();
}

function HorizontalFieldGroupInput(props: InputFieldProps) {
  const context = React.useContext(FieldGroupContext);

  const label = props.label ? <Label field={props.field} label={props.label} /> : null;
  const error = props.error ? <ErrorMessage error={props.error} /> : null;

  const className = context?.dividers ? "border-t last:border-b border-stroke-subtle py-2.5" : "";

  return (
    <div className={className}>
      <div className="flex gap-4 items-center">
        <div className="w-1/5 shrink-0">{label}</div>
        <div className="flex flex-col gap-0.5 w-4/5 flex-1">{props.children}</div>
      </div>

      <div className="flex gap-4 items-center mt-0.5">
        <div className="w-1/5 shrink-0"></div>
        <div className="w-4/5 flex-1">{error}</div>
      </div>
    </div>
  );
}

function VerticalFieldGroupInput(props: InputFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {props.label ? <Label field={props.field} label={props.label} /> : null}
      {props.children}
      {props.error ? <ErrorMessage error={props.error} /> : null}
    </div>
  );
}

function GridFieldGroupInput(props: InputFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {props.label ? <Label field={props.field} label={props.label} /> : null}
      {props.children}
      {props.error ? <ErrorMessage error={props.error} /> : null}
    </div>
  );
}
