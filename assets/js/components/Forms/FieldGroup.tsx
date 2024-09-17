import React from "react";

import { match } from "ts-pattern";

import * as Context from "./FieldGroup/Context";
import * as Vertical from "./FieldGroup/Vertical";
import * as Horizontal from "./FieldGroup/Horizontal";
import * as Grid from "./FieldGroup/Grid";

const DEFAULT_LAYOUT = "vertical";

interface FieldGroupProps {
  layout?: Context.LayoutType;
  layoutOptions?: Context.LayoutOptions;
  children: React.ReactNode;
}

export function FieldGroup(props: FieldGroupProps) {
  const layout = props.layout || DEFAULT_LAYOUT;

  const layoutOptions = match(layout)
    .with("horizontal", () => Horizontal.initializeOptions(props.layoutOptions as Horizontal.Options))
    .with("grid", () => Grid.initializeOptions(props.layoutOptions as Grid.Options))
    .with("vertical", () => Vertical.initializeOptions(props.layoutOptions as Vertical.Options))
    .run();

  return (
    <Context.Context.Provider value={{ layout, layoutOptions }}>
      <Container children={props.children} />
    </Context.Context.Provider>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  const layoutType = Context.useLayoutType();

  return match(layoutType)
    .with("vertical", () => <Vertical.Container children={children} />)
    .with("horizontal", () => <Horizontal.Container children={children} />)
    .with("grid", () => <Grid.Container children={children} />)
    .exhaustive();
}

export interface InputFieldProps {
  field: string;
  children: React.ReactNode;

  hidden?: boolean;
  label?: string;
  labelIcon?: React.ReactNode;
  error?: string;
}

export function InputField(props: InputFieldProps) {
  const layoutType = Context.useLayoutType();

  if (props.hidden) return null;

  return match(layoutType)
    .with("vertical", () => <Vertical.Input {...props} />)
    .with("horizontal", () => <Horizontal.Input {...props} />)
    .with("grid", () => <Grid.Input {...props} />)
    .exhaustive();
}
