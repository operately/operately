import React from "react";
import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";

interface Props {
  start: Date | string;
  end: Date | string;
  width?: string;
  progress?: number;
}

export function Chronometer({ start, end, width = "w-64", progress }: Props) {
  progress = React.useMemo(() => progress ?? findProgress(start, end), [start, end, progress]);
  const dividerContainerRef = React.useRef<HTMLDivElement>(null);
  const [dividers, setDividers] = React.useState<React.ReactNode[]>([]);

  React.useEffect(() => {
    if (dividerContainerRef.current) {
      const containerWidth = dividerContainerRef.current.offsetWidth;
      setDividers(generateDividers(containerWidth));
    }
  }, [width]);

  const gridLayout =
    "px-2 py-2 w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 absolute top-0 left-0 bottom-0";

  return (
    <div className={width}>
      <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg py-4 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 bottom-0 transition-all duration-300 bg-indigo-500 z-10"
          style={{ width: progress + "%" }}
        />

        <div
          className={gridLayout}
          style={{
            clipPath: `inset(0 ${100 - progress}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - progress}% 0 0)`,
            zIndex: 20,
          }}
        >
          <TimeDisplay time={start} isHighlighted={true} />
          <div />
          <TimeDisplay time={end} isHighlighted={true} />
        </div>

        <div
          className={gridLayout}
          style={{
            clipPath: `inset(0 0 0 ${progress}%)`,
            WebkitClipPath: `inset(0 0 0 ${progress}%)`,
            zIndex: 10,
          }}
        >
          <TimeDisplay time={start} />
          <div ref={dividerContainerRef} className="flex-1 flex items-center justify-center overflow-hidden">
            {dividers.length > 0 ? dividers : null}
          </div>
          <TimeDisplay time={end} />
        </div>
      </div>
    </div>
  );
}

function TimeDisplay({ time, isHighlighted = false }: { time: Date | string; isHighlighted?: boolean }) {
  const containerClass = classNames("text-xs z-1 relative whitespace-nowrap", {
    "text-white-1 font-bold": isHighlighted,
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

function generateDividers(containerWidth: number) {
  const dividerSpacing = 8;
  const count = Math.max(3, Math.floor(containerWidth / dividerSpacing));

  return Array.from({ length: count }).map((_, index) => {
    const height = index % 3 === 0 ? "h-3" : "h-2";
    return <span key={index} className={`mx-1 border-l border-surface-outline ${height} inline-block flex-shrink-0`} />;
  });
}
