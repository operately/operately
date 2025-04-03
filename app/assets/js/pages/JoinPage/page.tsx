import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Form } from "./Form";
import { useLoadedData } from "./loader";

export function Page() {
  return (
    <Pages.Page title="Welcome to Operately!">
      <Paper.Root size="small">
        <div className="mt-24"></div>

        <Paper.Body>
          <Header />
          <Form />
        </Paper.Body>
        <WhatHappensNext />
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { invitation } = useLoadedData();

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="">
        <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
        <div className="text-content-accent mt-1">
          You were invited by {invitation.admin!.fullName} to join {invitation.company!.name}.
        </div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}

function WhatHappensNext() {
  const { invitation } = useLoadedData();

  return (
    <div className="my-8 text-center px-20">
      <span className="font-bold">What happens next?</span> You will join the {invitation.company!.name} company and get
      access to the Operately platform.
    </div>
  );
}
