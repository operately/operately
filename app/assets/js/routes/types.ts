import { ShouldRevalidateFunction } from "react-router-dom";

export type Loader = ({ params, request }: { params: any; request: any }) => Promise<any>;

export interface PageModule {
  Page: React.ComponentType;
  loader: Loader;
  name: string;
  shouldRevalidate?: ShouldRevalidateFunction;
}
