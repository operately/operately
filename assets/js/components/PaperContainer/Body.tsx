import React from "react";

interface BodyProps {
  children: React.ReactNode;
}

const shadow =
  "0px 25px 19px -11px rgba(87, 121, 135, 0.1), 0px 4px 4px rgba(87, 118, 135, 0.1), 0px 2px 10px rgba(87, 126, 135, 0.1)";

export default function Body({ children }: BodyProps): JSX.Element {
  return (
    <div
      className="bg-white rounded-lg relative"
      style={{
        boxShadow: shadow,
        border: "0.5px solid rgba(0, 0, 0, 0.08)",
        padding: "30px 100px",
      }}
    >
      {children}
    </div>
  );
}
