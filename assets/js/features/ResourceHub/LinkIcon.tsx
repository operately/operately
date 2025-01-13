import React from "react";

import * as BrandIcons from "@/components/Brands";
import * as Icons from "@tabler/icons-react";
import { LinkOptions } from ".";

interface Props {
  type: LinkOptions;
  size: number;
}

export function LinkIcon({ type, size }: Props) {
  switch (type) {
    case "airtable":
      return <BrandIcons.Airtable size={size} />;
    case "dropbox":
      return <BrandIcons.Dropbox size={size} />;
    case "figma":
      return <BrandIcons.Figma size={size} />;
    case "google":
      return <BrandIcons.GoogleLogo size={size} />;
    case "google_doc":
      return <BrandIcons.GoogleDoc size={size} />;
    case "google_sheet":
      return <BrandIcons.GoogleSheets size={size} />;
    case "google_slides":
      return <BrandIcons.GoogleSlides size={size} />;
    case "notion":
      return <BrandIcons.Notion size={size} />;
    case "generic":
    default:
      return <Icons.IconLink size={size} />;
  }
}
