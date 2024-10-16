import React from "react";
import { TestableElement } from "@/utils/testid";

interface ProgressPieChartProps extends TestableElement {
  percent: number;
  color: string;
  size: number;
}

export function ProgressPieChart(props: ProgressPieChartProps) {
  const size = props.size;
  const percent = props.percent;
  const color = props.color;

  const center = size / 2;
  const radius = size / 2 - 2; // Slightly smaller to accommodate stroke

  // Calculate the angle for the pie slice
  const angle = (percent / 100) * 360;

  // Calculate the end point of the arc
  const endX = center + radius * Math.sin((angle * Math.PI) / 180);
  const endY = center - radius * Math.cos((angle * Math.PI) / 180);

  // Determine if we need to use the large arc flag
  const largeArcFlag = percent > 50 ? 1 : 0;
  const fillColor = color === "green" ? "#22c55e" : color === "yellow" ? "#eab308" : "#ef4444";
  const strokeColor = color === "green" ? "#15803d" : color === "yellow" ? "#a16207" : "#b91c1c";

  // Create the path for the pie slice
  let path;
  if (percent === 100) {
    // draw full circle
    path = `
      M ${center},${center}
      m -${radius}, 0
      a ${radius},${radius} 0 1,1 ${radius * 2},0
      a ${radius},${radius} 0 1,1 -${radius * 2},0
    `;
  } else {
    path = `
      M ${center},${center}
      L ${center},${center - radius}
      A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}
      Z
    `;
  }

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
        <path
          d={path}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1"
          style={{
            transition: "d 0.3s ease-in-out",
          }}
        />
      </svg>
    </div>
  );
}
