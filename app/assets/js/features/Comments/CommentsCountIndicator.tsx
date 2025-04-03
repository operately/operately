import React from "react";

export function CommentsCountIndicator({ count, size }: { count: number; size: number }) {
  if (count < 1) return <></>;

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.6,
    fontWeight: size > 20 ? "normal" : "bold",
  };

  const className = "bg-blue-500 text-white-1 flex items-center justify-center rounded-full";

  return (
    <div>
      <div className={className} style={style}>
        {count}
      </div>
    </div>
  );
}
