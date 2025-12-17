import React from "react";

import classNames from "../../utils/classnames";
import { IconArrowBackUp } from "../../icons";
import { StatusSelector } from "../../StatusSelector";
import { Tooltip } from "../../Tooltip";
import { createTestId } from "../../TestableElement";

export type DeletedStatusRowProps = {
  deletedStatus: StatusSelector.StatusOption;
  index: number;
  sanitizedStatuses: ReadonlyArray<StatusSelector.StatusOption>;
  replacementStatus: StatusSelector.StatusOption | null;
  isReplacementMissing: boolean;
  onSelectReplacement: (status: StatusSelector.StatusOption) => void;
  onRestore: () => void;
  showValidation: boolean;
};

export function DeletedStatusRow({
  deletedStatus,
  index,
  sanitizedStatuses,
  replacementStatus,
  isReplacementMissing,
  onSelectReplacement,
  onRestore,
  showValidation,
}: DeletedStatusRowProps) {
  return (
    <div className="flex flex-col gap-1" data-test-id={createTestId("deleted-status-row", index.toString())}>
      <div
        key={deletedStatus.id}
        className={classNames(
          "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-start sm:items-center gap-3 p-2",
          "border rounded-lg border-surface-subtle",
        )}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <StatusSelector
            statusOptions={[deletedStatus]}
            status={deletedStatus}
            onChange={() => {}}
            readonly
            testId={createTestId("deleted-status", deletedStatus.id)}
          />
          <span className="text-sm -mt-0.5">{deletedStatus.label}</span>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-2">
            <StatusSelector
              statusOptions={sanitizedStatuses}
              status={replacementStatus}
              onChange={onSelectReplacement}
              showFullBadge
              testId={createTestId("deleted-status-replacement", deletedStatus.id)}
              size="sm"
            />

            <Tooltip content="Restore this status" size="sm">
              <button
                type="button"
                onClick={onRestore}
                className="p-1 rounded transition text-content-dimmed hover:text-content-base hover:bg-surface-dimmed"
                aria-label="Restore status"
                data-test-id={createTestId("restore-deleted-status", deletedStatus.id)}
              >
                <IconArrowBackUp size={16} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {showValidation && isReplacementMissing && (
        <div
          className="text-xs text-rose-600 text-right"
          data-test-id={createTestId("missing-replacement", deletedStatus.id)}
        >
          Select a replacement status
        </div>
      )}
    </div>
  );
}
