import React from "react";

export default function Flare() {
  return (
    <div
      className="absolute"
      style={{
        top: 0,
        left: 0,
        right: 0,
        height: "500px",
        background:
          "radial-gradient(circle at top center, #FFFF0008 0%, #00000000 50%)",
        pointerEvents: "none",
      }}
    ></div>
  );
}
