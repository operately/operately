import React from "react";
import { CopyToClipboard } from "@/components/CopyToClipboard";


export function InvitationUrl({url}) {
  if(!url) return <></>;

  return (
    <div className="flex justify-between gap-3 m-2 px-2 bg-stroke-base rounded text-sm">
      <div className="flex flex-col pt-2 pb-2">
        Share this url with the new member:
        <u className="text-sm break-all">{url}</u>
      </div>
      <CopyToClipboard
        text={url}
        size={25}
        padding={1}
        containerClass="mt-1"
      />
    </div>
  );
}