import React from "react";

interface RootProps {
  children: React.ReactNode;
}

export default function Root({ children }: RootProps): JSX.Element {
  return <div className="mx-auto max-w-7xl" children={children} />;
}
