import React from "react";

import { assertPresent } from "@/utils/assertions";
import { ImageWithPlaceholder } from "@/components/Image";
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

  const imgRatio = file.blob.height! / file.blob.width!;

  return <ImageWithPlaceholder src={file.blob.url!} alt={file.name!} ratio={imgRatio} />;
}
