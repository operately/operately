import React from "react";

import { match } from "ts-pattern";
import classNames from "../utils/classnames";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import { Tooltip } from "../Tooltip";
import { durationHumanized, overdueDays } from "../utils/time";

export type Color = "indigo" | "stone";

interface Props {
  start: Date;
  end: Date;
  color?: Color;

  showOverdueWarning?: boolean;
}

const gridLayout = classNames(
  "px-2 py-2 w-full absolute top-0 left-0 bottom-0",
  "grid grid-cols-[auto_1fr_auto] items-center gap-2",
);

export function Chronometer({ start, end, color = "indigo", showOverdueWarning = false }: Props) {
  //
  // We are displaying two separate grids, one for the completed part and one for the remaining part.
  // The completed part is clipped to the left, and the remaining part is clipped to the right.
  // This way we can optimize the colors for the completed and remaining parts.
  //

  const progress = React.useMemo(() => findProgress(start, end), [start, end]);
  const overdueDaysCount = overdueDays(end);
  const overdue = showOverdueWarning && overdueDaysCount && overdueDaysCount > 0;

  const completedStyle = {
    clipPath: `inset(0 ${100 - progress}% 0 0)`,
    WebkitClipPath: `inset(0 ${100 - progress}% 0 0)`,
    zIndex: 20,
    right: overdue ? 16 : 0,
  };

  const remainingStyle = {
    clipPath: `inset(0 0 0 ${progress}%)`,
    WebkitClipPath: `inset(0 0 0 ${progress}%)`,
    zIndex: 10,
  };

  return (
    <ChronometerContainer>
      <ChronometerProgress progress={progress} color={color} />

      <div className="absolute inset-0 z-20">
        <div className="absolute inset-0" style={{ right: overdue ? 20 : 0 }}>
          <div className={gridLayout} style={completedStyle}>
            <TimeDisplay time={start} isHighlighted={true} bgColor={color} />
            <Dividers color={color} />
            <TimeDisplay time={end} isHighlighted={true} bgColor={color} />
          </div>
        </div>

        {overdue && <OverdueWarning bgColor={color} end={end} />}
      </div>

      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0" style={{ right: overdue ? 20 : 0 }}>
          <div className={gridLayout} style={remainingStyle}>
            <TimeDisplay time={start} bgColor={color} />
            <Dividers color="stone" />
            <TimeDisplay time={end} bgColor={color} />
          </div>
        </div>

        {overdue && <OverdueWarning bgColor={color} end={end} />}
      </div>
    </ChronometerContainer>
  );
}

function OverdueWarning({ bgColor, end }: { bgColor: Color; end: Date }) {
  const className = classNames("shrink-0", {
    "text-callout-error-message dark:text-white-1": bgColor === "stone",
    "text-white-1": bgColor === "indigo",
  });

  const content = "Overdue by " + durationHumanized(end, new Date());

  return (
    <div className="absolute top-2 right-[8px] z-30">
      <Tooltip content={content} className="text-sm shrink-0">
        <IconAlertTriangleFilled size={16} className={className} />
      </Tooltip>
    </div>
  );
}

function ChronometerContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg py-4 relative">
        {children}
      </div>
    </div>
  );
}

function ChronometerProgress({ progress, color }: { progress: number; color: Color }) {
  const outer = classNames("absolute top-0 left-0 bottom-0 w-full rounded-lg overflow-hidden");

  const inner = classNames("absolute top-0 left-0 bottom-0 transition-all duration-300 z-10", {
    "bg-indigo-500": color === "indigo",
    "bg-stone-300 opacity-50": color === "stone",
  });

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}

interface TimeDisplayProps {
  time: Date | string;
  bgColor: Color;
  isHighlighted?: boolean;
}

function TimeDisplay({ time, bgColor, isHighlighted = false }: TimeDisplayProps) {
  const containerClass = classNames("text-xs z-1 relative whitespace-nowrap", {
    "text-white-1 font-bold": isHighlighted && bgColor === "indigo",
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

  return <span className={containerClass}>{formatDate(time)}</span>;
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
