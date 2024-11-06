import * as React from "react";
import * as People from "@/models/people";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

import Avatar, { AvatarSize } from "@/components/Avatar";
import classNames from "classnames";

interface Props {
  people: People.Person[];
  size: AvatarSize;

  stacked?: boolean;
  linked?: boolean;
  maxElements?: number;

  showCutOff?: boolean;
}

const DEFAULT_VALUES = {
  stacked: false,
  maxElements: 5,
  showCutOff: true,
};

export default function AvatarList(props: Props) {
  const navigate = useNavigate();
  props = { ...DEFAULT_VALUES, ...props };

  const className = classNames("flex items-center flex-wrap", {
    "-space-x-2": props.stacked,
    "gap-1": !props.stacked,
  });
  const avatarClassName = classNames("border border-surface-base rounded-full flex items-center", {
    "cursor-pointer": props.linked,
  });

  const isCutOff = props.maxElements && props.people.length > props.maxElements;
  const people = isCutOff ? props.people.slice(0, props.maxElements) : props.people;

  const handleRedirect = (id: string) => {
    if (!props.linked) return;

    navigate(Paths.profilePath(id));
  };

  return (
    <div className={className}>
      {people!.map((a) => (
        <div className={avatarClassName} key={a.id} onClick={() => handleRedirect(a.id!)}>
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
