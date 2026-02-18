import * as React from "react";

type Page = "company" | "project" | "goal" | "space" | "profile";

interface FeedZeroStateProps {
  page: Page;
}

const DESCRIPTION_BY_PAGE: Record<Page, string> = {
  company: "Activity from your spaces, goals, and projects will appear here.",
  goal: "Activity from this goal will appear here once people start sharing updates.",
  profile: "This person's activities will appear here once they start sharing updates.",
  project: "Activity from this project will appear here once people start sharing updates.",
  space: "Activity from this space will appear here once people start sharing updates.",
};

export function FeedZeroState({ page }: FeedZeroStateProps) {
  return (
    <div className="w-full p-8 sm:p-10" data-test-id="feed-zero-state">
      <div className="flex flex-col items-center text-center">
        <FeedZeroStateIllustration />
        <h3 className="mt-1 text-xl font-bold text-content-accent">All quiet for now</h3>
        <p className="mt-2 max-w-xl text-sm text-content-dimmed">{DESCRIPTION_BY_PAGE[page]}</p>
      </div>
    </div>
  );
}

function FeedZeroStateIllustration() {
  return (
    <svg
      width="200"
      height="96"
      viewBox="0 0 200 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="text-content-dimmed"
    >
      <line x1="50" y1="8" x2="50" y2="88" stroke="#e8e2d9" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="50" cy="20" r="5" fill="#e8e2d9" />
      <circle cx="50" cy="48" r="5" fill="#e8e2d9" />
      <circle cx="50" cy="76" r="5" fill="#e8e2d9" />

      <rect x="66" y="14" width="88" height="9" rx="4" fill="#f0ede8" />
      <rect x="66" y="28" width="56" height="7" rx="3" fill="#f5f2ee" />
      <rect x="66" y="42" width="96" height="9" rx="4" fill="#f0ede8" />
      <rect x="66" y="56" width="64" height="7" rx="3" fill="#f5f2ee" />
      <rect x="66" y="70" width="80" height="9" rx="4" fill="#f0ede8" />
      <rect x="66" y="84" width="44" height="7" rx="3" fill="#f5f2ee" />

      <text x="158" y="26" fontFamily="DM Sans, sans-serif" fontSize="13" fontWeight="600" fill="#d4cfc8">
        z
      </text>
      <text x="166" y="18" fontFamily="DM Sans, sans-serif" fontSize="16" fontWeight="600" fill="#c8c2ba">
        z
      </text>
      <text x="177" y="10" fontFamily="DM Sans, sans-serif" fontSize="19" fontWeight="600" fill="#bdb8b0">
        z
      </text>
    </svg>
  );
}
