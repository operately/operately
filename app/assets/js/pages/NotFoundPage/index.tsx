import * as Pages from "@/components/Pages";
import { PageModule } from "@/routes/types";
import React from "react";
import { GhostButton } from "turboui";

import { usePaths } from "@/routes/paths";
import { useRouteLoaderData } from "react-router-dom";
export default { name: "NotFoundPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const data = useRouteLoaderData("companyRoot") as { company: { id: string | null } };

  return (
    <div className="absolute inset-0 flex justify-center items-center gap-16">
      <div className="flex flex-col text-center -mt-64">
        <div className="font-extrabold" style={{ fontSize: "10rem" }}>
          404
        </div>
        <div className="text-3xl font-bold mt-4">Page Not Found</div>
        <div className="text-lg font-medium my-4">Sorry, we couldn't find that page you were looking for.</div>

        {data && data.company ? <LinkToHome /> : <LinkToLobby />}
      </div>
    </div>
  );
}

function LinkToHome() {
  const paths = usePaths();

  return (
    <div className="flex w-full justify-center mt-4">
      <GhostButton linkTo={paths.homePath()} testId="back-to-lobby">
        Go back to Home
      </GhostButton>
    </div>
  );
}

function LinkToLobby() {
  return (
    <div className="flex w-full justify-center mt-4">
      <GhostButton linkTo={"/"} testId="back-to-lobby">
        Go back to Lobby
      </GhostButton>
    </div>
  );
}
