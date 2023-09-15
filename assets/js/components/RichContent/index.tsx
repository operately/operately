import React from "react";

import Mention from "@tiptap/extension-mention";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Blob from "@/components/Editor/Blob";

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
    const html = generateHTML(json, [Mention, StarterKit, Link, Blob]);

    return <div className={"ProseMirror " + className} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    throw jsonContent;
  }
}

RichContent.defaultProps = {
  className: "",
};
