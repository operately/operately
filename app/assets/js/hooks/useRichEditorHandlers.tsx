import React from "react";

import * as People from "@/models/people";
import * as Blobs from "@/models/blobs";

import { useOptionalPaths } from "@/routes/paths";
import { useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import { RichEditorHandlers } from "turboui";

interface Props {
  scope?: People.SearchScope;
}

export function useRichEditorHandlers(attrs?: Props): RichEditorHandlers {
  const paths = useOptionalPaths();
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

  const uploadFile = React.useCallback((file: File, onProgress: (progress: number) => void) => {
    return Blobs.uploadFile(file, onProgress);
  }, []);

  return {
    mentionedPersonLookup,
    ...(paths ? { peopleSearch, uploadFile } : {}),
  };
}
