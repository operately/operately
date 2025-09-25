import React from "react";

import * as People from "@/models/people";
import * as Blobs from "@/models/blobs";

import { usePaths } from "@/routes/paths";
import { useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import { RichEditorHandlers } from "turboui";

interface Props {
  scope?: People.SearchScope;
}

export function useRichEditorHandlers(attrs?: Props): RichEditorHandlers {
  const paths = usePaths();
  const mentionedPersonLookup = useMentionedPersonLookupFn();

  const peopleSearch = People.useMentionedPersonSearch({
    scope: attrs?.scope ?? People.NoneSearchScope,
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });

  const uploadFile = React.useCallback((file: File, onProgress: (progress: number) => void) => {
    return Blobs.uploadFile(file, onProgress);
  }, []);

  return {
    mentionedPersonLookup,
    peopleSearch,
    uploadFile,
  };
}
