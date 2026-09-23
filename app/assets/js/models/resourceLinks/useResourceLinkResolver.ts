import { useQueryClient } from "@tanstack/react-query";
import { useRouteLoaderData } from "react-router";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { getResourceLinkResolver } from "./resourceLinkResolver";

const emptyResolver = async () => [];

export function useResourceLinkResolver() {
  const client = useQueryClient();
  const data = useRouteLoaderData("companyRoot") as { companyId: string } | undefined;
  const me = useMe();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const companyId = data?.companyId;

  if (!me || !companyId || !origin) return emptyResolver;

  return getResourceLinkResolver(client, { origin, companyId }, me.id);
}
