import React from "react";
import { Content, useEditor } from "../RichEditor";

interface RichContentProps {
  content: any;
  className?: string;
}

export default function RichContent({ content, className }: RichContentProps): JSX.Element {
  const editor = useEditor({
    content: content,
    editable: false,
  });

  React.useEffect(() => {
    editor.setContent(content);
  }, [content]);

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
