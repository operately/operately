import React from "react";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Content() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  if (file.blob.contentType!.includes("image")) return <Image />;

  return <></>;
}

function Image() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  return (
    <div>
      <img alt={file.name!} src={file.blob.url!} />
    </div>
  );
}
