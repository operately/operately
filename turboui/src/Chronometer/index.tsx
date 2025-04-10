import React from "react";

import classNames from "classnames";
import { match } from "ts-pattern";

export type CompletedColor = "indigo" | "stone";

interface Props {
  start: Date | string;
  end: Date | string;
  width?: string;
  progress?: number;
  completedColor?: CompletedColor;
}

const gridLayout = "px-2 py-2 w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 absolute top-0 left-0 bottom-0";

export function Chronometer({ start, end, width = "w-64", progress, completedColor = "indigo" }: Props) {
  //
  // We are displaying two separate grids, one for the completed part and one for the remaining part.
  // The completed part is clipped to the left, and the remaining part is clipped to the right.
  // This way we can optimize the colors for the completed and remaining parts.
  //

  progress = React.useMemo(() => progress ?? findProgress(start, end), [start, end, progress]);

  const completedStyle = {
    clipPath: `inset(0 ${100 - progress}% 0 0)`,
    WebkitClipPath: `inset(0 ${100 - progress}% 0 0)`,
    zIndex: 20,
  };

  const remainingStyle = {
    clipPath: `inset(0 0 0 ${progress}%)`,
    WebkitClipPath: `inset(0 0 0 ${progress}%)`,
    zIndex: 10,
  };

  return (
    <ChronometerContainer width={width}>
      <ChronometerProgress progress={progress} completedColor={completedColor} />

      <div className={gridLayout} style={completedStyle}>
        <TimeDisplay time={start} isHighlighted={true} completedColor={completedColor} />
        <Dividers width={width} completedColor={completedColor} />
        <TimeDisplay time={end} isHighlighted={true} completedColor={completedColor} />
      </div>

      <div className={gridLayout} style={remainingStyle}>
        <TimeDisplay time={start} completedColor={completedColor} />
        <Dividers width={width} completedColor="stone" />
        <TimeDisplay time={end} completedColor={completedColor} />
      </div>
    </ChronometerContainer>
  );
}

function ChronometerContainer({ width, children }: { width: string; children: React.ReactNode }) {
  return (
    <div className={width}>
      <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg py-4 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ChronometerProgress({ progress, completedColor }: { progress: number; completedColor: CompletedColor }) {
  const className = classNames("absolute top-0 left-0 bottom-0 transition-all duration-300 z-10", {
    "bg-indigo-500": completedColor === "indigo",
    "bg-stone-300 opacity-50": completedColor === "stone",
  });

  return <div className={className} style={{ width: progress + "%" }} />;
}

interface TimeDisplayProps {
  time: Date | string;
  completedColor: CompletedColor;
  isHighlighted?: boolean;
}

function TimeDisplay({ time, isHighlighted = false, completedColor }: TimeDisplayProps) {
  const containerClass = classNames("text-xs z-1 relative whitespace-nowrap", {
    "text-white-1 font-bold": isHighlighted && completedColor === "indigo",
  });

  if (typeof time === "string") {
    time = new Date(time);
  }

  return (
    <span className={containerClass}>
      <FormattedTime time={time} format="short-date" />
    </span>
  );
}

function findProgress(start: Date | string, end: Date | string) {
  if (typeof start === "string") {
    start = new Date(start);
  }
  if (typeof end === "string") {
    end = new Date(end);
  }

  const startTime = start.getTime();
  const endTime = end.getTime();
  const currentTime = new Date().getTime();

  const totalDuration = endTime - startTime;
  const elapsedTime = Math.max(0, currentTime - startTime);

  return Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
}

function Dividers({ width, completedColor }: { width: string; completedColor: CompletedColor }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [dividers, setDividers] = React.useState<React.ReactNode[]>([]);
  const color = match(completedColor)
    .with("indigo", () => "border-indigo-300")
    .with("stone", () => "border-surface-outline")
    .exhaustive();

  React.useEffect(() => {
    if (ref.current) {
      const containerWidth = ref.current.offsetWidth;
      setDividers(generateDividers(containerWidth, color));
    }
  }, [width, color]);

  return (
    <div ref={ref} className="flex-1 flex items-center justify-center overflow-hidden">
      {dividers.length > 0 ? dividers : null}
    </div>
  );
}

function generateDividers(containerWidth: number, color: string) {
  const dividerSpacing = 8;
  const count = Math.max(3, Math.floor(containerWidth / dividerSpacing));

  return Array.from({ length: count }).map((_, index) => {
    const height = index % 3 === 0 ? "h-3" : "h-2";
    return <span key={index} className={`mx-1 border-l ${color} ${height} inline-block flex-shrink-0`} />;
  });
}
