import React from "react";

import classNames from "classnames";
import { match } from "ts-pattern";

export type Color = "indigo" | "stone";

interface Props {
  start: Date;
  end: Date;
  color?: Color;
}

const gridLayout = "px-2 py-2 w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 absolute top-0 left-0 bottom-0";

export function Chronometer({ start, end, color = "indigo" }: Props) {
  //
  // We are displaying two separate grids, one for the completed part and one for the remaining part.
  // The completed part is clipped to the left, and the remaining part is clipped to the right.
  // This way we can optimize the colors for the completed and remaining parts.
  //

  const progress = React.useMemo(() => findProgress(start, end), [start, end]);

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
    <ChronometerContainer>
      <ChronometerProgress progress={progress} color={color} />

      <div className={gridLayout} style={completedStyle}>
        <TimeDisplay time={start} isHighlighted={true} color={color} />
        <Dividers color={color} />
        <TimeDisplay time={end} isHighlighted={true} color={color} />
      </div>

      <div className={gridLayout} style={remainingStyle}>
        <TimeDisplay time={start} color={color} />
        <Dividers color="stone" />
        <TimeDisplay time={end} color={color} />
      </div>
    </ChronometerContainer>
  );
}

function ChronometerContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg py-4 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ChronometerProgress({ progress, color }: { progress: number; color: Color }) {
  const className = classNames("absolute top-0 left-0 bottom-0 transition-all duration-300 z-10", {
    "bg-indigo-500": color === "indigo",
    "bg-stone-300 opacity-50": color === "stone",
  });

  return <div className={className} style={{ width: progress + "%" }} />;
}

interface TimeDisplayProps {
  time: Date | string;
  color: Color;
  isHighlighted?: boolean;
}

function TimeDisplay({ time, isHighlighted = false, color }: TimeDisplayProps) {
  const containerClass = classNames("text-xs z-1 relative whitespace-nowrap", {
    "text-white-1 font-bold": isHighlighted && color === "indigo",
  });

  if (typeof time === "string") {
    time = new Date(time);
  }

  const formatDate = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    if (year === currentYear) {
      return `${day} ${month}`;
    } else {
      return `${day} ${month} '${String(year).slice(-2)}`;
    }
  };

  return (
    <span className={containerClass}>
      {formatDate(time)}
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

  // If current time is after end date, return 100%
  if (currentTime >= endTime) {
    return 100;
  }

  // If current time is before start date, return 0%
  if (currentTime <= startTime) {
    return 0;
  }

  const totalDuration = endTime - startTime;
  const elapsedTime = currentTime - startTime;

  return (elapsedTime / totalDuration) * 100;
}

function Dividers({ color }: { color: Color }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [dividers, setDividers] = React.useState<React.ReactNode[]>([]);
  const dividerColor = match(color)
    .with("indigo", () => "border-indigo-300")
    .with("stone", () => "border-surface-outline")
    .exhaustive();

  React.useEffect(() => {
    if (ref.current) {
      const containerWidth = ref.current.offsetWidth;
      setDividers(generateDividers(containerWidth, dividerColor));
    }
  }, [dividerColor]);

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
