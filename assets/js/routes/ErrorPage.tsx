import React from "react";
import { GhostButton } from "@/components/Button";
import { Paths } from "./paths";

export default function ErrorPage() {
  return (
    <div className="absolute inset-0 flex justify-center items-center gap-16">
      <div className="flex flex-col text-center -mt-64">
        <div className="font-extrabold" style={{ fontSize: "10rem" }}>
          500
        </div>
        <div className="text-3xl font-bold mt-4">Oops! Something went wrong.</div>
        <div className="text-lg font-medium my-4">An unexpected error has occurred.</div>

        <div className="flex w-full justify-center mt-4">
          <GhostButton linkTo={Paths.homePath()} type="primary" testId="back-to-lobby">
            Go back to Home
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
