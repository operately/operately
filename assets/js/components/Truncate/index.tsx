import React from "react";

interface TruncateProps {
  lines: number;
  children: React.ReactNode;
}

export const Truncate = React.forwardRef<HTMLDivElement, TruncateProps>((props, ref) => {
  const { lines, children } = props;
  return (
    <div
      ref={ref}
      style={{
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
        wordBreak: "break-all",
        display: "-webkit-box",
      }}
    >
      {children}
    </div>
  );
});

export function useIsClamped(ref: React.RefObject<HTMLDivElement>) {
  const [isClamped, setIsClamped] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return setIsClamped(false);

    console.log(ref.current.scrollHeight, ref.current.clientHeight);

    setIsClamped(ref.current.scrollHeight > ref.current.clientHeight);
  }, [ref]);

  return isClamped;
}
