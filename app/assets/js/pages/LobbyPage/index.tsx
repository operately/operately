import { loader, useLoadedData } from "./loader";
import * as People from "@/models/people";
import * as React from "react";

import { LobbyPage } from "turboui";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";

export default { name: "LobbyPage", loader, Page } as PageModule;

function Page() {
  const { account, companies } = useLoadedData();

  const firstName = People.firstName({ fullName: account.fullName });

  return (
    <LobbyPage
      firstName={firstName}
      companies={companies.map((company) => ({
        id: company.id,
        name: company.name,
        memberCount: company.memberCount ?? 0,
        link: Paths.companyHomePath(company.id),
      }))}
      newCompanyPath={Paths.newCompanyPath()}
      adminPath={account.siteAdmin ? "/admin" : null}
      version={window.appConfig.releaseVersion}
      showCurrentVersion
    />
  );
}
