import React from "react";

interface RootProps {
  children: React.ReactNode;
}

export default function Root({ children }: RootProps): JSX.Element {
  return (
    <div
      className="mx-auto"
      style={{
        width: "963px",
        paddingTop: "104px",
      }}
      children={children}
    />
  );
}
