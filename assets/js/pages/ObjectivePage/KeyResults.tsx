import React from "react";

import { KeyResult } from "@/graphql/Objectives";

interface KeyResultItemProps {
  keyResult: KeyResult;
}

function Badge({ title, className }): JSX.Element {
  return (
    <div
      className="inline-block"
      style={{
        verticalAlign: "middle",
      }}
    >
      <div
        className={className + " font-bold uppercase flex items-center"}
        style={{
          padding: "4px 10px 2px",
          borderRadius: "25px",
          fontSize: "12.5px",
          lineHeight: "20px",
          height: "24px",
          letterSpacing: "0.03em",
          display: "flex",
          gap: "10",
          marginTop: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
    </div>
  );
}

const stepColors = {
  on_track: "text-success-1",
  lagging: "text-warning-1",
  poor: "text-danger-1",
  pending: "text-dark-1",
};

const badgeBgColor = {
  on_track: "bg-success-2",
  lagging: "bg-warning-2",
  poor: "bg-danger-2",
  pending: "bg-light-2",
};

const badgeTextColor = {
  on_track: "text-success-1",
  lagging: "text-warning-1",
  poor: "text-danger-1",
  pending: "text-dark-2",
};

function KeyResultItem({ keyResult }: KeyResultItemProps): JSX.Element {
  const status = keyResult.status;
  let stepColor = stepColors[status];
  let badgeColor = badgeBgColor[status] + " " + badgeTextColor[status];

  return (
    <div className="rounded bg-light-1 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="font-bold text-[10px] text-dark-2 mr-[25px]">KR</div>
          <div className="text-[18px] leading-[27px] font-medium text-dark-base">
            {keyResult.name}
          </div>
        </div>

        <div
          className="border-l border-dark-8p shrink-0"
          style={{ width: "152px", paddingLeft: "23px", marginLeft: "23px" }}
        >
          <div className="-mt-[6px] -ml-[4px]">
            <Badge
              title={keyResult.status.replace("_", " ")}
              className={badgeColor}
            />
          </div>

          <div className="font-medium mt-[6px]">
            <span className={stepColor}>{keyResult.stepsCompleted}</span>/
            {keyResult.stepsTotal} completed
          </div>
        </div>
      </div>
    </div>
  );
}

interface KeyResultListProps {
  keyResults: KeyResult[];
}

export default function KeyResultList({
  keyResults,
}: KeyResultListProps): JSX.Element {
  return (
    <div className="relative mt-[18px] border-b border-dark-8p pb-[18px]">
      <div className="relative border-l border-dark-8p z-10"></div>
      <div className="relative z-20 flex flex-col gap-[15px]">
        {keyResults.map((keyResult) => (
          <KeyResultItem key={keyResult.id} keyResult={keyResult} />
        ))}
      </div>
    </div>
  );
}
