import React from "react";

import * as Icons from "@/components/Brands";
import { LinkOptions } from ".";

interface Props {
  type: LinkOptions;
  size: number;
}

export function LinkIcon({ type, size }: Props) {
  switch (type) {
    case "airtable":
      return <Icons.Airtable size={size} />;
    case "dropbox":
      return <Icons.Dropbox size={size} />;
    case "figma":
      return <Icons.Figma size={size} />;
    case "google":
      return <Icons.GoogleLogo size={size} />;
    case "google_doc":
      return <Icons.GoogleDoc size={size} />;
    case "google_sheet":
      return <Icons.GoogleSheets size={size} />;
    case "google_slides":
      return <Icons.GoogleSlides size={size} />;
    case "notion":
      return <Icons.Notion size={size} />;
  }
}
