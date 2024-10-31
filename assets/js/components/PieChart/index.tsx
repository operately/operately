import React from "react";

interface Slice {
  size: number;
  color: "green" | "yellow" | "red" | "gray";
}

interface PieChartProps {
  size?: number;
  total: number;
  slices: Slice[];
}

const COLORS = {
  green: "rgb(22, 163, 74)",
  yellow: "rgb(250, 204, 21)",
  red: "rgb(239, 68, 68)",
  gray: "rgb(107, 114, 128)",
};

export function PieChart({ size = 20, total, slices }: PieChartProps) {
  const className = `w-[${size}px] h-[${size}px] rounded-full`;

  const chartBackground = React.useMemo(() => {
    let start = 0;
    const result: string[] = [];

    slices.forEach((slice) => {
      const end = (slice.size * 100) / total;
      const roundedEnd = Number(end.toFixed(1));
      const color = COLORS[slice.color];

      result.push(`${color} ${start}% ${start + roundedEnd}%`);
      start += roundedEnd;
    });

    return result.join(", ");
  }, []);

  return (
    <div
      className={className}
      style={{
        background: `conic-gradient(${chartBackground})`,
      }}
    />
  );
}
