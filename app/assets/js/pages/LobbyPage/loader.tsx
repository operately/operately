import { assertPresent } from "@/utils/assertions";
import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { Paths } from "@/routes/paths";
import { hashKey } from "@tanstack/react-query";
import { redirect } from "react-router";

function currentContext() {
  return { basePath: Api.default.getBasePath(), headers: { ...Api.default.getHeaders() } };
}

type RequestContext = ReturnType<typeof currentContext>;

function isCurrentContext(context: RequestContext) {
  return (
    context.basePath === Api.default.getBasePath() && hashKey([context.headers]) === hashKey([Api.default.getHeaders()])
  );
}

function scopedOptions<T extends { queryKey: readonly unknown[] }>(options: T, context: RequestContext) {
  return {
    ...options,
    queryKey: [options.queryKey[0], context.basePath, context.headers, ...options.queryKey.slice(3)] as T["queryKey"],
    enabled: () => isCurrentContext(context),
  };
}

function accountOptions(context: RequestContext, input: object) {
  return scopedOptions(Api.people.getAccountQueryOptions(input), context);
}

function companiesOptions(context: RequestContext, input: { includeMemberCount: boolean }) {
  return scopedOptions(Api.companies.listQueryOptions(input), context);
}

export async function loader() {
  const context = currentContext();
  const accountInput = {};
  const companiesInput = { includeMemberCount: true };
  const [, { companies }] = await Promise.all([
    queryClient.fetchQuery({ ...accountOptions(context, accountInput), staleTime: Infinity }),
    queryClient.fetchQuery({ ...companiesOptions(context, companiesInput), staleTime: Infinity }),
  ]);

  const [company] = companies;
  if (companies.length === 1 && company) {
    return redirect(Paths.companyHomePath(company.id));
  }

  return { context, accountInput, companiesInput };
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function useLoadedData() {
  const { context, accountInput, companiesInput } = Pages.useLoadedData<LoaderResult>();

  const account = useLoadedQuery(accountOptions(context, accountInput));
  const companies = useLoadedQuery(companiesOptions(context, companiesInput));
  if (account.isPending || companies.isPending) return null;

  assertPresent(account.data?.account, "Account is unavailable");
  assertPresent(companies.data?.companies, "Company list is unavailable");

  return { account: account.data.account, companies: companies.data.companies };
}
