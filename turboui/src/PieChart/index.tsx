import React from "react";

interface Slice {
  percentage: number;
  color: string;
}

interface PieChartProps {
  size?: number;
  bgcolor?: string;
  slices: Slice[];
}

export function PieChart({ size = 20, bgcolor = "var(--color-zinc-200)", slices }: PieChartProps) {
  const colors = React.useMemo(() => {
    let start = 0;
    let total = 0;

    const result: string[] = [];

    slices.forEach((slice) => {
      const roundedPercentage = Number(slice.percentage.toFixed(1));

      result.push(`${slice.color} ${start}% ${start + roundedPercentage}%`);
      start += roundedPercentage;
      total += roundedPercentage;
    });

    if(total < 100) {
      result.push(`${bgcolor} ${start}% 100%`);
    }

    return `conic-gradient(${result.join(", ")})`;
  }, [slices]);

  return (
    <div
      className="rounded-full"
      style={{
        background: colors,
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
}
