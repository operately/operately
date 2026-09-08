import Api, { Person } from "@/api";
import { Paths } from "@/routes/paths";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { companyPeopleQueryOptions } from "@/models/people/useCompanyPeople";
import { CurrentCompanyProvider, useMentionedPersonLookupFn } from "./CurrentCompanyContext";

jest.mock("@/signals", () => ({ useProfileUpdatedSignal: jest.fn() }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  ...jest.requireActual("@/routes/paths"),
  useOptionalPaths: () => new Paths({ companyId: "company-1" }),
}));

const person: Person = {
  __typename: "person",
  id: "person-1",
  fullName: "Alex Rivera",
  title: "Engineer",
  avatarUrl: null,
  email: "alex@example.com",
  type: "member",
};
const people = { people: [person] };
let client: QueryClient;
let get: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.mount();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  get = jest.spyOn(axios, "get");
});

afterEach(() => {
  client.unmount();
  client.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("resolves cached mentions while people are refreshing", async () => {
  client.setQueryData(Api.people.getMeQueryKey({ includeManager: true }), { me: person });
  client.setQueryData(companyPeopleQueryOptions().queryKey, people);
  let finishRequest: (response: unknown) => void = () => {};
  get.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
  );
  const request = client.fetchQuery(companyPeopleQueryOptions());

  let lookup: ReturnType<typeof useMentionedPersonLookupFn> = async () => null;
  function Mention() {
    lookup = useMentionedPersonLookupFn();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <CurrentCompanyProvider>
        <Mention />
      </CurrentCompanyProvider>
    </QueryClientProvider>,
  );

  await expect(lookup(person.id)).resolves.toMatchObject({ id: person.id, fullName: person.fullName });
  finishRequest({ data: people });
  await request;
});
