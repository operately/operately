import * as React from "react";

export function SpacesZeroState() {
  return (
    <div className="bg-surface-base shadow rounded-2xl">
      <div className="w-full p-8 sm:p-10 dark:bg-stone-900/20 dark:rounded-2xl" data-test-id="spaces-zero-state">
        <div className="flex flex-col items-center text-center">
          <SpacesZeroStateIllustration />
          <h3 className="-mt-5 text-xl font-bold text-content-accent dark:text-content-base">No spaces yet</h3>
          <p className="mt-2 max-w-xl text-sm text-content-dimmed">
            Spaces will appear here when someone grants you access to them.
          </p>
        </div>
      </div>
    </div>
  );
}

function SpacesZeroStateIllustration() {
  return (
    <svg
      width="338"
      height="124"
      viewBox="0 0 338 124"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="w-full max-w-[338px] h-auto text-content-dimmed dark:opacity-80"
    >
      <g className="text-[#f5f2ee] dark:text-stone-700">
        <rect x="6" y="24" width="100" height="62" rx="11" fill="currentColor" />
        <rect x="232" y="24" width="100" height="62" rx="11" fill="currentColor" />
      </g>

      <g className="text-[#f0ede8] dark:text-stone-600">
        <rect x="119" y="14" width="100" height="62" rx="11" fill="currentColor" />
      </g>

      <g className="text-[#e4ddd4] dark:text-stone-500">
        <rect x="6.75" y="24.75" width="98.5" height="60.5" rx="10.25" stroke="currentColor" strokeWidth="1.5" />
        <rect x="119.75" y="14.75" width="98.5" height="60.5" rx="10.25" stroke="currentColor" strokeWidth="1.5" />
        <rect x="232.75" y="24.75" width="98.5" height="60.5" rx="10.25" stroke="currentColor" strokeWidth="1.5" />
      </g>

      <g className="text-[#dfd7ce] dark:text-stone-500">
        <rect x="16" y="35" width="42" height="5" rx="2.5" fill="currentColor" />
        <rect x="16" y="44.5" width="70" height="3.6" rx="1.8" fill="currentColor" />
        <rect x="16" y="51.5" width="58" height="3.6" rx="1.8" fill="currentColor" />

        <rect x="129" y="25" width="45" height="5" rx="2.5" fill="currentColor" />
        <rect x="129" y="34.5" width="71" height="3.6" rx="1.8" fill="currentColor" />
        <rect x="129" y="41.5" width="56" height="3.6" rx="1.8" fill="currentColor" />

        <rect x="242" y="35" width="44" height="5" rx="2.5" fill="currentColor" />
        <rect x="242" y="44.5" width="72" height="3.6" rx="1.8" fill="currentColor" />
        <rect x="242" y="51.5" width="54" height="3.6" rx="1.8" fill="currentColor" />
      </g>

      <g className="text-[#d4cdc4] dark:text-stone-400">
        <circle cx="18" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="27" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="36" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="45" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="54" cy="68.5" r="4.2" fill="currentColor" />

        <circle cx="131" cy="58.5" r="4.2" fill="currentColor" />
        <circle cx="140" cy="58.5" r="4.2" fill="currentColor" />
        <circle cx="149" cy="58.5" r="4.2" fill="currentColor" />
        <circle cx="158" cy="58.5" r="4.2" fill="currentColor" />
        <circle cx="167" cy="58.5" r="4.2" fill="currentColor" />
        <circle cx="176" cy="58.5" r="4.2" fill="currentColor" />

        <circle cx="244" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="253" cy="68.5" r="4.2" fill="currentColor" />
        <circle cx="262" cy="68.5" r="4.2" fill="currentColor" />
      </g>
    </svg>
  );
}
