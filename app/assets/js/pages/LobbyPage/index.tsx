import Api, { Account, Company } from "@/api";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";
import * as React from "react";

import { LobbyPage } from "turboui";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { PRODUCT_RELEASE_ANNOUNCEMENTS_FEATURE } from "@/routes/companyLoader";

export default { name: "LobbyPage", loader, Page } as PageModule;

interface LoaderResult {
  account: Account;
  companies: Company[];
}

async function loader(): Promise<LoaderResult> {
  return {
    account: await Api.people.getAccount({}).then((res) => res.account!),
    companies: await Api.companies
      .list({
        includeMemberCount: true,
      })
      .then((res) => res.companies!),
  };
}

function Page() {
  const { account, companies } = Pages.useLoadedData<LoaderResult>();

  assertPresent(account.fullName);
  const firstName = People.firstName({ fullName: account.fullName });

  return (
    <LobbyPage
      firstName={firstName}
      companies={companies.map((company) => ({
        id: company.id!,
        name: company.name!,
        memberCount: company.memberCount!,
        link: Paths.companyHomePath(company.id!),
      }))}
      newCompanyPath={Paths.newCompanyPath()}
      adminPath={account.siteAdmin ? "/admin" : null}
      version={window.appConfig.releaseVersion}
      showCurrentVersion={companies.some((company) =>
        Companies.hasFeature(company, PRODUCT_RELEASE_ANNOUNCEMENTS_FEATURE),
      )}
    />
  );
}
