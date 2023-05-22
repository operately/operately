import React from "react";
import Navigation from "./Navigation";

const paperShadow =
  "0px 25px 19px -11px rgba(87, 121, 135, 0.1), 0px 4px 4px rgba(87, 118, 135, 0.1), 0px 2px 10px rgba(87, 126, 135, 0.1)";

interface PaperContainerProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
}

export default function PaperContainer({
  children,
  navigation,
}: PaperContainerProps): JSX.Element {
  return (
    <div
      className="mx-auto"
      style={{
        width: "963px",
        paddingTop: "104px",
      }}
    >
      {navigation && <Navigation>{navigation}</Navigation>}

      <div
        className="bg-white rounded-lg relative"
        style={{
          boxShadow: paperShadow,
          border: "0.5px solid rgba(0, 0, 0, 0.08)",
          padding: "30px 100px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
