import React from "react";
import classNames from "../utils/classnames";
import { AvatarListProps } from "./types";
import { Avatar } from ".";

const DEFAULT_VALUES = {
  stacked: false,
  stackSpacing: "-space-x-2",
  maxElements: 5,
  showCutOff: true,
  wrap: true,
};

export function AvatarList(props: AvatarListProps) {
  props = { ...DEFAULT_VALUES, ...props };

  const className = classNames("flex items-center", {
    [props.stackSpacing!]: props.stacked,
    "gap-1": !props.stacked,
    "flex-wrap": props.wrap,
  });
  const avatarClassName = classNames("border border-surface-base rounded-full flex items-center");

  const isCutOff = props.maxElements && props.people.length > props.maxElements;
  const people = isCutOff ? props.people.slice(0, props.maxElements) : props.people;

  return (
    <div className={className}>
      {people!.map((a) => (
        <div className={avatarClassName} key={a.id}>
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
  const className = classNames("flex items-center font-bold text-sm text-content-dimmed");
  const style = { paddingLeft: stacked ? "0.75rem" : "" };

  return (
    <div className={className} style={style}>
      +{count}
    </div>
  );
}
