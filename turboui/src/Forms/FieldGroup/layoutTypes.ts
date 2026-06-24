export interface VerticalLayoutOptions {}

export interface HorizontalLayoutOptions {
  ratio: "1:1" | "1:2" | "1:3" | "1:4" | "1:5" | "2:1" | "3:1" | "4:1" | "5:1";
  dividers: boolean;
}

export interface GridLayoutOptions {
  columns: number;
  gridTemplateColumns?: string;
}

export type LayoutType = "horizontal" | "vertical" | "grid";
export type LayoutOptions = HorizontalLayoutOptions | VerticalLayoutOptions | GridLayoutOptions;
