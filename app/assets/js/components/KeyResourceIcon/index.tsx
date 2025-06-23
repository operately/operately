import * as React from "react";
import * as Brands from "@/components/Brands";
import { IconLink } from "turboui";

export function ResourceIcon({ resourceType, size }: { resourceType: string; size: number }) {
  switch (resourceType) {
    case "github-repository":
      return <Brands.Github size={size} />;
    case "google-sheet":
      return <Brands.GoogleSheets size={size} />;
    case "google-document":
      return <Brands.GoogleDoc size={size} />;
    case "basecamp-project":
      return <Brands.Basecamp size={size} />;
    case "slack-channel":
      return <Brands.Slack size={size} />;
    case "generic":
    default:
      return <IconLink size={size} />;
  }
}
