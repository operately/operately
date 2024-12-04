import React from "react";
import { useLoadedData } from "./loader";

export function Content() {
  const { file } = useLoadedData();

  if (file.type?.includes("image")) return <Image />;

  return <></>;
}

function Image() {
  const { file } = useLoadedData();

  return (
    <div>
      <img src={file.url!} />
    </div>
  );
}
