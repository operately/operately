import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { extract, truncate } from "./contentOps";

type WrapperType = "div" | "span";

interface SummaryProps {
  jsonContent: string;
  characterCount: number;
  as?: WrapperType;
}

const DEFAULT_VALUES = {
  as: "div" as WrapperType,
};

export function Summary(props: SummaryProps) {
  props = { ...DEFAULT_VALUES, ...props };

  const { jsonContent, characterCount, as } = props;

  const { editor } = TipTapEditor.useEditor({
    content: parseContent(jsonContent),
    editable: false,
    mentionSearchScope: People.NoneSearchScope,
  });

  React.useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(parseContent(jsonContent));
  }, [jsonContent]);

  let summary: JSX.Element[] = React.useMemo(() => {
    if (!editor) return [<></>];

    const extracted = extract(editor.state.doc);
    const truncated = truncate(extracted, characterCount);

    return truncated;
  }, [editor, jsonContent]);

  if (!editor) return <></>;

  if (as === "span") {
    return <span>{summary}</span>;
  } else {
    return <div>{summary}</div>;
  }
}

function parseContent(content?: string | any): any {
  if (content?.constructor?.name === "String") {
    return JSON.parse(content);
  } else {
    return content;
  }
}
