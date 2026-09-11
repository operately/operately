import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateEmailChangeProfiles } from "./emailChangeLifecycle";

it("refreshes account and profile queries across companies without invalidating unrelated data", async () => {
  const client = new QueryClient();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "first" });
  const first = Api.people.getMeQueryKey({ includeManager: true });
  const unrelated = Api.projects.listQueryKey({});
  Api.default.setHeaders({ "x-company-id": "second" });
  const second = Api.people.getMeQueryKey({});
  const profile = Api.people.getQueryKey({ id: "person" });
  const account = Api.people.getAccountQueryKey({});
  const people = Api.people.listQueryKey({});
  [first, second, profile, account, people, unrelated].forEach((key) => client.setQueryData(key, {}));

  await invalidateEmailChangeProfiles(client);

  [first, second, profile, account, people].forEach((key) =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});
