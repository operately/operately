import React from "react";

interface ContainerProps {
  children: React.ReactElement[];
}

export default function Container({ children }: ContainerProps): JSX.Element {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {children.map((child, index: number) =>
        React.cloneElement(child, {
          first: index === 0,
          last: index === children.length - 1,
        })
      )}
    </div>
  );
}
