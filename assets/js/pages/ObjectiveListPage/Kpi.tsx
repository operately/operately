import React from "react";
import Icon from "../../components/Icon";
import { useNavigate } from "react-router-dom";

type ShowSignOptions = "always" | "onlyNegative";

function formatMetric(value, unit, showSign: ShowSignOptions = "onlyNegative") {
  let sign = "";

  let v = Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  switch (showSign) {
    case "always":
      sign = value > 0 ? "+" : "-";
      break;
    case "onlyNegative":
      sign = value > 0 ? "" : "-";
      break;
  }

  if (unit === "percentage") {
    return sign + v + "%";
  }

  if (unit === "currency") {
    return sign + "$" + v;
  }

  if (unit === "duration") {
    return v + " mins";
  }

  return value;
}

export function KPIValues({ kpi }) {
  if (kpi.metrics.length === 0) {
    return <div className="text-center text-gray-500">No Data</div>;
  }

  let values = kpi.metrics.map((m) => m.value / 1000);
  let target = kpi.target / 1000;
  let diffs = values.map((v) => v);

  let areaHeight = 50;

  let range = [0, areaHeight];
  let domain = [0, Math.max(...diffs)];
  let padding = { top: 16, left: 16, right: 16, bottom: 0 };

  let h = (number) => {
    return (number * areaHeight) / domain[1];
  };

  let months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  let bars: JSX.Element[] = [];
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    let diff = diffs[i];

    let height = h(diff);
    let top = h(domain[1] - diff);

    let color = "bg-green-500";
    if (kpi.targetDirection === "above" && value < target) {
      color = "bg-red-500";
    }
    if (kpi.targetDirection === "below" && value > target) {
      color = "bg-red-500";
    }

    color = "bg-white/70";

    bars.push(
      <div
        className={"z-10 w-[12px] relative" + " " + color}
        style={{
          top: top + "px",
          height: height + "px",
        }}
      >
        <div className="-bottom-4 absolute text-[10px] pl-[2px]">
          {months[i]}
        </div>
      </div>
    );
  }

  let lastValue = "--";
  let lastChange = "--";

  if (values.length > 0) {
    lastValue = formatMetric(values[values.length - 1], kpi.unit);
  }

  if (values.length > 1) {
    let change = values[values.length - 1] - values[values.length - 2];
    lastChange = formatMetric(change, kpi.unit, "always");
  }

  return (
    <div>
      <div className="w-full p-2 px-4">
        <div className="flex gap-2 text-sm items-center justify-between w-full">
          <div>Target</div>

          <div className={"font-bold"}>
            {kpi.targetDirection === "above" ? "> " : "< "}
            {formatMetric(kpi.target / 1000, kpi.unit)}
          </div>
        </div>

        <div className="flex gap-2 text-sm items-center justify-between w-full">
          <div>Current</div>
          <div
            className={
              (kpi.targetDirection === "above" && values[0] > kpi.target) ||
              (kpi.targetDirection === "below" && values[0] < kpi.target)
                ? "text-red-500 font-bold"
                : "text-green-500 font-bold"
            }
          >
            {lastValue}
          </div>
        </div>

        <div className="flex gap-2 text-sm items-center justify-between w-full">
          <div>Last Change</div>

          <div className={"font-bold"}>{lastChange}</div>
        </div>
      </div>

      <div className="w-full bg-new-dark-2 mb-5">
        <div
          className="relative flex gap-[7.5px] items-start w-full mt-2"
          style={{
            height: padding.top + padding.bottom + range[1] + "px",
            paddingTop: padding.top + "px",
            paddingLeft: padding.left + "px",
            paddingRight: padding.right + "px",
            paddingBottom: padding.bottom + "px",
          }}
        >
          <div
            className="absolute -left-3 -right-3 border-t border-gray-400 text-right "
            style={{
              top: range[1] + padding.top - 1 + "px",
            }}
          ></div>

          {[0, 16, 32, 48, 64, 80, 96].map((v, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-r border-gray-700 text-right "
              style={{
                width: v + "%",
              }}
            ></div>
          ))}

          {[0, 25, 50, 75, 100].map((v, i) => (
            <div
              key={i}
              className="absolute -left-3 -right-3 border-t border-gray-700 text-right "
              style={{
                top: (v / 100.0) * range[1] + "px",
              }}
            ></div>
          ))}

          {bars}
        </div>
      </div>
    </div>
  );
}

export function KPI({ kpi, clickable }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate("/kpis/" + kpi.id);
    }
  };

  return (
    <div
      className={
        "flex flex-col rounded bg-new-dark-2 group" +
        (clickable ? " cursor-pointer" : "")
      }
      onClick={handleClick}
    >
      <div className="rounded overflow-hidden">
        <div className="px-4 pt-4">
          <div className="font-bold truncate">{kpi.name}</div>
        </div>

        <div className="">
          <KPIValues kpi={kpi} />
        </div>
      </div>
    </div>
  );
}
