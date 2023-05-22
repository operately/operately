import React from "react";

interface ContainerProps {
  children: React.ReactElement[];
  active: string;
  onTabChange: (id: string) => void;
}

export default function Container(props: ContainerProps) {
  return (
    <div
      className="flex items-center gap-[24px] bg-white mt-[26px]"
      style={{
        boxShadow: "inset 0px -1px 0px #EEEEEE",
      }}
    >
      {props.children.map((child, index) =>
        React.cloneElement(child, {
          key: index,
          active: props.active === child.props.id,
          onClick: props.onTabChange,
        })
      )}
    </div>
  );
}
