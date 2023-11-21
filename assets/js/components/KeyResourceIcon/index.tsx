import * as React from "react";
import * as Brands from "@/components/Brands";
import * as Icons from "@tabler/icons-react";
import * as KeyResources from "@/graphql/Projects/key_resources";

const GithubLinkRegex = new RegExp("^https://github.com/.*/.*$");
const GoogleSheetLinkRegex = new RegExp("^https://docs.google.com/spreadsheets/d/.*$");

export function ResourceIcon({ resource }: { resource: KeyResources.KeyResource }) {
  if (resource.link.match(GithubLinkRegex)) {
    return <Brands.Github size={34} />;
  }

  if (resource.link.match(GoogleSheetLinkRegex)) {
    return <Brands.GoogleSheets size={34} />;
  }

  return <Icons.IconLink size={34} />;
}
