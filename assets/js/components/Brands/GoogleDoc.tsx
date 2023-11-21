import React from "react";

export function GoogleDoc({ size }) {
  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width={size + "px"}
      height={size + "px"}
      viewBox="0 0 64 88"
      style={{
        enableBackground: "new 0 0 64 88",
      }}
      xmlSpace="preserve"
    >
      <style type="text/css">{"\n\t.st0{fill:#3086F6;}\n\t.st1{fill:#0C67D6;}\n\t.st2{fill:#FDFFFF;}\n"}</style>
      <g id="Layer_5">
        <path className="st0" d="M58,88H6c-3.3,0-6-2.7-6-6V6c0-3.3,2.7-6,6-6h36l22,22v60C64,85.3,61.3,88,58,88z" />
        <path className="st1" d="M42,0l22,22H42V0z" />
        <path className="st2" d="M50,39H14v-5h36V39z M50,46H14v5h36V46z M40,58H14v5h26V58z" />
      </g>
    </svg>
  );
}
