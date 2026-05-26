import type { ActivityContentResourceHubDocumentEdited, ActivityContentResourceHubLinkEdited } from "@/api";
import { useLocale } from "@/contexts/TimezoneContext";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";
import { usePaths } from "@/routes/paths";
import * as React from "react";
import { Link } from "turboui";

interface EditedResource {
  key: string;
  name: string;
  path: string;
}

interface ListPart {
  type: "element" | "literal";
  value: string;
}

export function EditedResourceList({ activity }: { activity: Activity }) {
  const paths = usePaths();
  const locale = useLocale();
  const resources = editedResourcesForFeed(activity, paths);
  const parts = listParts(resources.length, locale);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "literal") return <React.Fragment key={index}>{part.value}</React.Fragment>;

        const resource = resources[Number(part.value)];
        if (!resource) return null;

        return (
          <Link key={resource.key} to={resource.path}>
            {resource.name}
          </Link>
        );
      })}
    </>
  );
}

function editedResourcesForFeed(activity: Activity, paths: ReturnType<typeof usePaths>): EditedResource[] {
  const seen = new Set<string>();

  return Activities.getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt || "").localeCompare(b.insertedAt || ""))
    .map((activity) => editedResource(activity, paths))
    .filter((resource): resource is EditedResource => resource !== null)
    .filter((resource) => {
      if (seen.has(resource.key)) return false;

      seen.add(resource.key);
      return true;
    });
}

function editedResource(activity: Activity, paths: ReturnType<typeof usePaths>): EditedResource | null {
  switch (activity.action) {
    case "resource_hub_document_edited": {
      const data = activity.content as ActivityContentResourceHubDocumentEdited | null | undefined;
      const document = data?.document;

      if (!document?.id || !document.name) return null;

      return {
        key: `document:${document.id}`,
        name: document.name,
        path: paths.resourceHubDocumentPath(document.id),
      };
    }

    case "resource_hub_link_edited": {
      const data = activity.content as ActivityContentResourceHubLinkEdited | null | undefined;
      const link = data?.link;

      if (!link?.id || !link.name) return null;

      return {
        key: `link:${link.id}`,
        name: link.name,
        path: paths.resourceHubLinkPath(link.id),
      };
    }

    default:
      return null;
  }
}

function listParts(count: number, locale: string): ListPart[] {
  const items = Array.from({ length: count }, (_, index) => String(index));
  const listFormat = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

  return listFormat.formatToParts(items).map((part) => ({
    type: part.type === "element" ? "element" : "literal",
    value: part.value,
  }));
}
