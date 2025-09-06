import { useRouteLoaderData } from "react-router-dom";
import { usePaths } from "@/routes/paths";

/**
 * Hook that safely returns the appropriate home path based on context.
 * Returns company-specific home path when in company routes, otherwise returns root "/".
 * Unlike usePaths(), this hook doesn't throw when used outside company context.
 */
export function useHomePath(): string {
  const data = useRouteLoaderData("companyRoot") as { company: { id: string | null } } | null;
  
  // If we're not in a company route context, return root
  if (!data || !data.company) {
    return "/";
  }
  
  // If we're in a company route context, use the paths helper
  try {
    const paths = usePaths();
    return paths.homePath();
  } catch {
    // Fallback to root if paths helper fails for any reason
    return "/";
  }
}