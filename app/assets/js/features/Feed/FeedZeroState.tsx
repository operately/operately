import * as React from "react";

type Page = "company" | "project" | "goal" | "space" | "profile";

interface FeedZeroStateProps {
  page: Page;
}

const DESCRIPTION_BY_PAGE: Record<Page, string> = {
  company: "Activity from your spaces, goals, and projects will appear here.",
  goal: "Activity from this goal will appear here once people start sharing updates.",
  profile: "This person's activity will appear here once they start sharing updates.",
  project: "Activity from this project will appear here once people start sharing updates.",
  space: "Activity from this space will appear here once people start sharing updates.",
};

export function FeedZeroState({ page }: FeedZeroStateProps) {
  return (
    <div className="w-full p-8 sm:p-10 dark:bg-stone-900/20 dark:rounded-2xl" data-test-id="feed-zero-state">
      <div className="flex flex-col items-center text-center">
        <FeedZeroStateIllustration />
        <h3 className="mt-4 text-xl font-bold text-content-accent dark:text-content-base">All quiet for now</h3>
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
      className="text-content-dimmed dark:opacity-80"
    >
      <g className="text-[#e8e2d9] dark:text-stone-600">
        <line x1="50" y1="8" x2="50" y2="88" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="50" cy="20" r="5" fill="currentColor" />
        <circle cx="50" cy="48" r="5" fill="currentColor" />
        <circle cx="50" cy="76" r="5" fill="currentColor" />
      </g>

      <g className="text-[#f0ede8] dark:text-stone-500">
        <rect x="66" y="14" width="88" height="9" rx="4" fill="currentColor" />
        <rect x="66" y="42" width="96" height="9" rx="4" fill="currentColor" />
        <rect x="66" y="70" width="80" height="9" rx="4" fill="currentColor" />
      </g>

      <g className="text-[#f5f2ee] dark:text-stone-700">
        <rect x="66" y="28" width="56" height="7" rx="3" fill="currentColor" />
        <rect x="66" y="56" width="64" height="7" rx="3" fill="currentColor" />
        <rect x="66" y="84" width="44" height="7" rx="3" fill="currentColor" />
      </g>

      <text
        x="158"
        y="26"
        fontFamily="DM Sans, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="currentColor"
        className="text-[#d4cfc8] dark:text-stone-500"
      >
        z
      </text>
      <text
        x="166"
        y="18"
        fontFamily="DM Sans, sans-serif"
        fontSize="16"
        fontWeight="600"
        fill="currentColor"
        className="text-[#c8c2ba] dark:text-stone-500"
      >
        z
      </text>
      <text
        x="177"
        y="10"
        fontFamily="DM Sans, sans-serif"
        fontSize="19"
        fontWeight="600"
        fill="currentColor"
        className="text-[#bdb8b0] dark:text-stone-400"
      >
        z
      </text>
    </svg>
  );
}
