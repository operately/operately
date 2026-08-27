import React from "react";

export namespace CurrentVersion {
  export interface Props {
    version?: string | null;
  }
}

// Brand-signature footer line: quiet text in the spirit of Gumroad's footer
// and Midday's lobby. No borders or backgrounds — present if you look for it,
// invisible while picking a company.
export function CurrentVersion({ version }: CurrentVersion.Props) {
  if (!version) return null;

  return (
    <p className="flex items-center gap-2 text-xs text-content-subtle" data-test-id="current-version">
      <span className="font-medium text-content-dimmed">Operately</span>
      <span className="tabular-nums">{formatVersion(version)}</span>
    </p>
  );
}

function formatVersion(version: string): string {
  const bare = version.replace(/^v(?=\d)/i, "");

  return /^\d/.test(bare) ? `v${bare}` : bare;
}
