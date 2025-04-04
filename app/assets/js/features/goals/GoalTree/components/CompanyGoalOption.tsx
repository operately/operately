import React from "react";
import { TableRow } from "./TableRow";
import { IconBuildingEstate } from "@tabler/icons-react";
import { PrimaryButton } from "turboui";

export function CompanyGoalOption({ handleSelect }: { handleSelect: () => void }) {
  return (
    <TableRow>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IconBuildingEstate size={16} />
          <span className="mt-1">Company-wide goal</span>
        </div>
        <PrimaryButton onClick={handleSelect} size="xxs" testId="select-company-wide-option">
          Select
        </PrimaryButton>
      </div>
    </TableRow>
  );
}
