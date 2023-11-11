import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Companines from "@/graphql/Companies";
import * as Me from "@/graphql/Me";

interface LoaderResult {
  company: Companines.Company;
  me: any;
}

export async function loader(): Promise<LoaderResult> {
  let company = await client.query({
    query: Companines.GET_COMPANY,
    variables: { id: Companines.companyID() },
    fetchPolicy: "network-only",
  });

  let me = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    company: company.data.company,
    me: me.data.me,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
