import React from "react";

export function CommentsCountIndicator({ count }: { count: number }) {
  if (count < 1) return <></>;

  return (
    <div>
      <div className="w-[16px] h-[16px] bg-blue-500 text-white-1 flex items-center justify-center rounded-full text-[9px] font-bold">
        {count}
      </div>
    </div>
  );
}
