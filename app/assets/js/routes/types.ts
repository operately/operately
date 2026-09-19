import { ShouldRevalidateFunction } from "react-router";

type Loader = ({ params, request }: { params: any; request: any }) => Promise<any>;

export interface PageModule {
  Page: React.ComponentType;
  loader: Loader;
  name: string;
  shouldRevalidate?: ShouldRevalidateFunction;
  /** Navigation-only preparation; never run during speculative data loading. */
  onNavigate?: (args: Parameters<Loader>[0]) => void;
}
