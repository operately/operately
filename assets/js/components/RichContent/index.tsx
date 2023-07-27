import React from "react";

import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Mention from "@tiptap/extension-mention";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import { generateHTML } from "@tiptap/html";

/*
 * This is a function that takes a JSON string and returns a React component.
 * The json content must be in the format that tiptap uses.
 */

interface RichContentProps {
  jsonContent: string;
  className?: string;
}

export default function RichContent({ jsonContent, className }: RichContentProps): JSX.Element {
  try {
    if (jsonContent === null || jsonContent === "null") {
      return <div className={"ProseMirror " + className}></div>;
    }

    if (jsonContent === undefined) {
      return <div className={"ProseMirror " + className}>Content not available.</div>;
    }

    const json = JSON.parse(jsonContent);

    const html = generateHTML(json, [
      Document,
      Paragraph,
      Text,
      Bold,
      Mention,
      ListItem,
      BulletList,
      OrderedList,
      HardBreak,
      Heading,
    ]);

    return <div className={"ProseMirror " + className} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    throw jsonContent;
  }
}

RichContent.defaultProps = {
  className: "",
};
