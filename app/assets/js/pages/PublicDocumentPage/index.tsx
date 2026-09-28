import React from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Api from "@/api";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { PublicDocumentPage } from "turboui";
import type { PageModule } from "@/routes/types";

function Reader() {
  const { token = "" } = useParams();
  const query = useQuery({
    ...Api.documents.getPublicQueryOptions({ token }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchInterval: 30_000,
  });
  const formattedTimePreferences = useFormattedTimePreferences();
  return (
    <PublicDocumentPage
      document={query.isError ? undefined : query.data?.document}
      loading={query.isPending}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}

function Page() {
  return (
    <TimezoneProvider>
      <Reader />
    </TimezoneProvider>
  );
}

export default { name: "PublicDocumentPage", loader: async () => null, Page } as PageModule;
