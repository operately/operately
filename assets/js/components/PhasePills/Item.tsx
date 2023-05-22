import React from "react";
import Icon from "../Icon";

type State = "done" | "inProgress" | "pending";

interface ItemProps {
  name: string;
  state: State;
  first?: boolean;
  last?: boolean;
}

const bgColors = {
  done: "bg-brand-2",
  inProgress: "bg-brand-1",
  pending: "bg-light-2",
};

const fgColors = {
  done: "text-brand-1",
  inProgress: "text-white",
  pending: "text-dark-2",
};

const startArrowColors = {
  done: "text-white",
  inProgress: "text-white",
  pending: "text-white",
};

const endArrowColors = {
  done: "text-brand-2",
  inProgress: "text-brand-1",
  pending: "text-light-2",
};

function ArrowRight({ className }) {
  return (
    <svg height="20" width="5" className={className}>
      <polygon points="0,0  0,20 5,10" fill="currentColor" />
    </svg>
  );
}

function StatusIcon({ state }: { state: State }): JSX.Element | null {
  if (state === "done") {
    return <Icon name="checkmark" size="tiny" color="brand" />;
  } else {
    return <span className="w-[4px]"></span>;
  }
}

export default function Item({
  name,
  state,
  first,
  last,
}: ItemProps): JSX.Element {
  const className = [
    bgColors[state],
    fgColors[state],
    "flex items-center justify-center flex-1",
    "text-[9px] uppercase font-medium",
    "h-[20px]",
  ].join(" ");

  const startArrowColor = startArrowColors[state];
  const endArrowColor = endArrowColors[state];

  return (
    <div className="relative">
      {first ? null : (
        <div className="absolute top-0 left-0">
          <ArrowRight className={startArrowColor} />
        </div>
      )}

      <div className={className} style={{ lineHeight: "11px" }}>
        <StatusIcon state={state} /> <span className="ml-1">{name}</span>
      </div>

      {last ? null : (
        <div className="absolute top-0 -right-[5px]">
          <ArrowRight className={endArrowColor} />
        </div>
      )}
    </div>
  );
}

Item.defaultProps = {
  first: false,
  last: false,
};
