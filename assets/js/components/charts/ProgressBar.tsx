import React from "react";
import classNames from "classnames";

interface Props {
  percentage: number;

  color?: string;
  bgColor?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  previousValue?: number;
  previousValueColor?: string;
}

const DEFAULTS = {
  width: "w-24",
  height: "h-2.5",
  color: "var(--color-accent-1)",
  bgColor: "var(--color-surface-outline)",
  previousValueColor: "var(--color-accent-1)",
  rounded: true,
};

export function ProgressBar(props: Props) {
  props = { ...DEFAULTS, ...props };

  const roundedClass = props.rounded ? "rounded" : "";

  const outerClass = classNames("relative", props.height, props.width, roundedClass);

  const innerClass = classNames(
    "absolute top-0 bottom-0 left-0",
    props.color,
    roundedClass,
    "transition-all",
    "duration-300",
  );

  const bgStyle = {
    backgroundColor: props.bgColor,
  };

  const clampedPercentage = Math.min(100, Math.max(0, props.percentage));

  const style = {
    width: `${clampedPercentage}%`,
    backgroundColor: props.color,
  };

  return (
    <div className={outerClass} style={bgStyle}>
      <div className={innerClass} style={style} />
      {props.previousValue && (
        <>
          <DiffMarker current={clampedPercentage} previous={props.previousValue} color={props.previousValueColor} />
          <PreviousValueMarker percentage={props.previousValue} color={props.previousValueColor} />
        </>
      )}
    </div>
  );
}

function DiffMarker(props: { current: number; previous: number; color?: string }) {
  if (props.current === props.previous) return null;
  if (props.current > props.previous) return null;

  const style = {
    left: `${props.current}%`,
    width: `${props.previous - props.current}%`,
    backgroundColor: "var(--color-surface-outline)",
  };

  return <div className="absolute top-0 bottom-0" style={style} />;
}

function PreviousValueMarker(props: { percentage: number; color?: string }) {
  if (props.percentage < 0) return null;
  if (props.percentage > 100) return null;

  const style = {
    left: `${props.percentage}%`,
    backgroundColor: props.color,
  };

  return <div className="absolute top-0 bottom-0 w-1" style={style} />;
}
