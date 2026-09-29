import React from "react";

import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { assertPresent } from "@/utils/assertions";

import * as People from "@/models/people";
import * as Blobs from "@/models/blobs";

import { useOptionalPaths } from "@/routes/paths";
import { useMe, useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import { RichEditorHandlers } from "turboui";

interface Props {
  scope?: People.SearchScope;
}

export function useRichEditorHandlers(attrs?: Props): RichEditorHandlers {
  const paths = useOptionalPaths();
  const me = useMe();
  const viewerId = me?.id;
  const companyPath = paths?.homePath();
  const mentionedPersonLookup = useMentionedPersonLookupFn();

  const peopleSearch = People.useMentionedPersonSearch({
    scope: attrs?.scope ?? People.NoneSearchScope,
    transformResult: (p) => {
      if (paths) {
        return People.parsePersonForTurboUi(paths, p)!;
      }

      // It never executes if paths is not present
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        title: p.title || "",
        avatarUrl: p.avatarUrl || "",
        profileLink: "",
      };
    },
  });

  const resolveResourceLinks = React.useCallback<NonNullable<RichEditorHandlers["resolveResourceLinks"]>>(
    async (urls) => {
      if (!viewerId || !companyPath) return [];
      const options = Api.rich_content.resolveLinksQueryOptions({ urls });
      const queryFn = options.queryFn;

      assertPresent(queryFn, "Missing resource link query function");

      const result = await queryClient.query({
        queryKey: ["rich-content-links", options.queryKey, companyPath, viewerId],
        queryFn: (context) => queryFn({ ...context, queryKey: options.queryKey }),
        staleTime: 0,
      });
      return result.links;
    },
    [companyPath, viewerId],
  );

  const uploadFile = React.useCallback((file: File, onProgress: (progress: number) => void) => {
    return Blobs.uploadFile(file, onProgress);
  }, []);

  return {
    mentionedPersonLookup,
    resolveResourceLinks: paths ? resolveResourceLinks : null,
    ...(paths ? { peopleSearch, uploadFile } : {}),
  };
}
