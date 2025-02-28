import { PrimaryButton } from "@/components/Buttons";
import * as React from "react";

export function Status({ goal }) {
  return (
    <div>
      <div className="mt-4 mb-1 uppercase text-xs font-bold tracking-wider">Next Check-in</div>
      Scheduled for March 15th, 2025
      <div className="mt-1" />
      <div className="text-base">
        <PrimaryButton size="xs">Check-in Now</PrimaryButton>
      </div>
    </div>
  );
}
