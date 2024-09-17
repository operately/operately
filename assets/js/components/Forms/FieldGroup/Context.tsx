import React from "react";

import * as Vertical from "./Vertical";
import * as Horizontal from "./Horizontal";
import * as Grid from "./Grid";

export type LayoutType = "horizontal" | "vertical" | "grid";
export type LayoutOptions = Horizontal.Options | Vertical.Options | Grid.Options;

interface ContextProps {
  layout: LayoutType;
  layoutOptions: LayoutOptions;
}

export const Context = React.createContext<ContextProps | null>(null);

export function useLayoutOptions<T extends LayoutOptions>(): T {
  const config = React.useContext(Context);
  if (!config) throw new Error("FieldGroupItem must be used within a FieldGroup component");

  return config.layoutOptions as T;
}

export function useLayoutType(): LayoutType {
  const config = React.useContext(Context);
  if (!config) throw new Error("FieldGroupItem must be used within a FieldGroup component");

  return config.layout;
}
