import React from "react";

interface BodyProps {
  children: React.ReactNode;
}

export default function Body({ children }: BodyProps): JSX.Element {
  return <div className="mt-32 relative z-50">{children}</div>;
}
