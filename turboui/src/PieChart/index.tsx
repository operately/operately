import React from "react";

interface Slice {
  percentage: number;
  color: string;
}

interface PieChartProps {
  size?: number;
  bgcolor?: string;
  ariaLabel?: string;
  title?: string;
  slices: Slice[];
}

export function PieChart({ size = 20, bgcolor = "var(--color-surface-subtle)", ariaLabel, title, slices }: PieChartProps) {
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
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      title={title}
      style={{
        background: colors,
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
}
