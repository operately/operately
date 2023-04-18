import React from 'react';

import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Mention from '@tiptap/extension-mention'
import { generateHTML } from '@tiptap/html';

/*
 * This is a function that takes a JSON string and returns a React component.
 * The json content must be in the format that tiptap uses.
 */

interface RichContentProps {
  jsonContent: string;
}

export default function RichContent({jsonContent}: RichContentProps) : JSX.Element {
  const json = JSON.parse(jsonContent);

  const html = generateHTML(json, [
    Document,
    Paragraph,
    Text,
    Bold,
    Mention,
  ]);

  return <div className="prose p-4" dangerouslySetInnerHTML={{__html: html}} />
}
