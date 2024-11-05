import * as React from "react";
import * as People from "@/models/people";

import Avatar, { AvatarSize } from "@/components/Avatar";
import classNames from "classnames";

interface Props {
  people: People.Person[];
  size: AvatarSize;

  stacked?: boolean;
  maxElements?: number;

  showCutOff?: boolean;
}

const DEFAULT_VALUES = {
  stacked: false,
  maxElements: 5,
  showCutOff: true,
};

export default function AvatarList(props: Props) {
  props = { ...DEFAULT_VALUES, ...props };

  const className = classNames("flex items-center flex-wrap", {
    "-space-x-2": props.stacked,
    "gap-1": !props.stacked,
  });

  const isCutOff = props.maxElements && props.people.length > props.maxElements;
  const people = isCutOff ? props.people.slice(0, props.maxElements) : props.people;

  return (
    <div className={className}>
      {people!.map((a) => (
        <div className="border border-surface-base rounded-full flex items-center" key={a.id}>
          <Avatar person={a} size={props.size} />
        </div>
      ))}

      {isCutOff && props.showCutOff && (
        <CutOffIndicator count={props.people.length - props.maxElements!} stacked={!!props.stacked} />
      )}
    </div>
  );
}

function CutOffIndicator({ count, stacked }: { count: number; stacked: boolean }) {
  const className = classNames("flex items-center font-bold text-sm text-content-dimmed", {
    "pl-4": stacked,
  });

  return <div className={className}>+{count}</div>;
}
