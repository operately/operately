import React from "react";

import { assertPresent } from "@/utils/assertions";
import { ImageWithPlaceholder } from "@/components/Image";
import { useLoadedData } from "./loader";

export function Content() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  if (file.blob.contentType?.includes("image")) return <Image />;
  if (file.blob.contentType?.includes("video")) return <Video />;

  return <></>;
}

function Image() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  const imgRatio = file.blob.height! / file.blob.width!;

  return <ImageWithPlaceholder src={file.blob.url!} alt={file.name!} ratio={imgRatio} />;
}

function Video() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  const videoRatio = file.blob.height! / file.blob.width!;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${videoRatio * 100}%`,
        overflow: "hidden",
      }}
    >
      <video controls style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        <source src={file.blob.url!} type="video/mp4" />
        Your browser does not support videos.
      </video>
    </div>
  );
}
