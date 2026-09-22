import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouteLoaderData } from "react-router";

import Api from "@/api";
import { collectResourceLinkRefs, type ResourceLinkTitle } from "turboui";

export function useResourceLinkTitles(content: unknown): ResourceLinkTitle[] {
  const data = useRouteLoaderData("companyRoot") as { companyId: string } | undefined;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const companyId = data?.companyId;

  const resources = useMemo(() => {
    if (!companyId || !origin) return [];
    return collectResourceLinkRefs(content, { origin, companyId });
  }, [content, companyId, origin]);

  const types = resources.map((resource) => resource.type);
  const ids = resources.map((resource) => resource.id);

  const query = useQuery({
    ...Api.rich_content.resolveLinksQueryOptions({ types, ids }),
    enabled: resources.length > 0,
  });

  return query.data?.links ?? [];
}
