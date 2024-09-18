import React from "react";

import { usePerfBarData } from "./usePerfBarData";
import { useGetMe } from "@/models/people";

export function PerfBar() {
  const meData = useGetMe({});

  if (meData?.loading) return null;
  if (meData?.error) return null;
  if (!meData?.data?.me?.showPerfBar) return null;

  return (
    <div className="bg-black text-white-1 p-1 text-sm font-mono z-50">
      <div className="flex justify-between">
        <Left />
        <Right />
      </div>
    </div>
  );
}

function Left() {
  return (
    <div className="flex items-center gap-6">
      <div className="text-green-500">PERFBAR</div>
      <ToggleTestIds />
    </div>
  );
}

function ToggleTestIds() {
  const [show, setShow] = React.useState(false);
  const status = show ? "ON" : "OFF";
  const color = show ? "text-green-500" : "text-white-1";

  const toggle = () => setShow(!show);
  const className = color + " cursor-pointer";

  return (
    <div className="">
      TestIDs [
      <span className={className} onClick={toggle}>
        {status}
      </span>
      ]
      {show && (
        <style>
          {`
          [data-test-id] {
            outline: ${show ? "1px solid red" : "none"};
          }
          
          [data-test-id]::before {
            content: attr(data-test-id);
            position: absolute;
            z-index: 9999;
            background: red !important;
            color: white;
            font-size: 12px;
            padding: 1px 3px;
            white-space: nowrap;
            font-weight: bold;
          }
        `}
        </style>
      )}
    </div>
  );
}

function Right() {
  const data = usePerfBarData();
  const pageLoadColor = data.pageLoad < 500 ? "text-green-500" : "text-content-error";

  return (
    <div className="flex items-center gap-8">
      <div>
        Page Load: <span className={pageLoadColor}>{data.pageLoad.toFixed(0)}ms</span>
      </div>

      <div>
        Network Requests: <span className="text-green-500">{data.networkRequests}</span>
      </div>
    </div>
  );
}
