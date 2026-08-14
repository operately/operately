import React from "react";

import type { ProductRelease } from "../ProductReleaseAnnouncement";
import { genPeople } from "../utils/storybook/genPeople";
import type { HomePage } from "./index";

const people = genPeople(6);

export const v18ProductRelease: ProductRelease = {
  id: "v1.8",
  title: "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more",
  url: "https://operately.com/releases/v180/",
  publishedAt: "2026-07-17",
  teaser: "Bring AI into your work, prepare updates ahead of time, and review goal and project outcomes.",
  paragraphs: [
    "Operately v1.8 is here. This release makes it easier to bring AI into your work, prepare updates ahead of time, and review goal and project outcomes. You can now connect an AI client through MCP, schedule discussions and check-ins for later, and acknowledge project and goal retrospectives.",
    "Operately now supports remote MCP connections for OAuth-capable AI clients. Connect a client, sign in to Operately, approve the requested access, and choose the company it should use.",
    "You can now schedule a discussion, goal check-in, or project check-in for a future date and time.",
  ],
};

export const shortParagraphsRelease: ProductRelease = {
  ...v18ProductRelease,
  id: "v1.8-short",
  paragraphs: [
    "Operately v1.8 is here.",
    "Connect MCP, schedule posts, and acknowledge retrospectives.",
    "There is more in the full release post.",
  ],
};

export const mockSpaces: HomePage.Space[] = [
  {
    id: "company-space",
    name: "Company",
    mission: "Everyone's home for company-wide work.",
    isCompanySpace: true,
    linkTo: "/spaces/company",
    members: people.slice(0, 5),
  },
  {
    id: "product",
    name: "Product",
    mission: "Ship the product customers love.",
    linkTo: "/spaces/product",
    members: people.slice(0, 4),
  },
  {
    id: "ops",
    name: "Operations",
    mission: "Keep the company running smoothly.",
    linkTo: "/spaces/ops",
    members: people.slice(1, 4),
  },
];

export function MockFeed() {
  return (
    <div className="p-6 space-y-4" data-test-id="company-feed">
      <MockFeedItem author="Sarah C." text="posted a check-in on Q3 Launch" />
      <MockFeedItem author="James R." text="completed the MCP connections milestone" />
      <MockFeedItem author="Priya S." text="commented on the weekly operations review" />
    </div>
  );
}

function MockFeedItem({ author, text }: { author: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-surface-dimmed" />
      <p className="text-sm text-content-base">
        <span className="font-semibold">{author}</span> {text}
      </p>
    </div>
  );
}
