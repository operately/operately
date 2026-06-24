import React from "react";

import type { LayoutOptions, LayoutType } from "./layoutTypes";

interface ContextProps {
  layout: LayoutType;
  layoutOptions: LayoutOptions;
}

export const Context = React.createContext<ContextProps | null>(null);

export function useLayoutOptions<T extends LayoutOptions>(): T {
  const config = React.useContext(Context);

  if (!config) {
    return {} as T;
  }

  return config.layoutOptions as T;
}

export function useLayoutType(): LayoutType {
  const config = React.useContext(Context);

  if (!config) {
    return "vertical";
  }

  return config.layout;
}

export type { LayoutOptions, LayoutType } from "./layoutTypes";
