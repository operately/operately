import Api from "@/api";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { invalidateKpiCommentQueries } from "./kpiCommentQueries";

jest.mock("turboui", () => ({}));
jest.mock("@/routes/paths", () => ({ compareIds: jest.requireActual("@/routes/paths").compareIds }));

const context = { entryId: "entry1", kpiId: "kpi1", spaceId: "space1" };
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("invalidates the entry thread and its KPI counts across ID variants, leaving other resources intact", async () => {
  const client = new QueryClient();
  const affected = [
    Api.comments.listQueryKey({ entityId: "entry1", entityType: "kpi_entry" }),
    Api.comments.listQueryKey({ entityId: "old-entry1", entityType: "kpi_entry" }),
    Api.kpis.getKpiQueryKey({ kpiId: "kpi1" }),
    Api.kpis.getKpiQueryKey({ kpiId: "old-kpi1" }),
    Api.kpis.listKpisQueryKey({ spaceId: "space1" }),
    Api.kpis.listKpisQueryKey({ spaceId: "old-space1" }),
  ];
  const unrelated = [
    Api.comments.listQueryKey({ entityId: "entry2", entityType: "kpi_entry" }),
    Api.comments.listQueryKey({ entityId: "entry1", entityType: "project_task" }),
    Api.kpis.getKpiQueryKey({ kpiId: "kpi2" }),
    Api.kpis.listKpisQueryKey({ spaceId: "space2" }),
    Api.spaces.getQueryKey({ id: "space1" }),
  ];
  Api.default.setHeaders({ "x-company-id": "company2" });
  unrelated.push(Api.kpis.getKpiQueryKey({ kpiId: "kpi1" }));
  Api.default.setHeaders({ "x-company-id": "company1" });
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  try {
    await invalidateKpiCommentQueries(client, context);
    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  } finally {
    client.clear();
  }
});

it("defers refetches until the optimistic batch settles", async () => {
  const client = new QueryClient();
  const key = Api.kpis.getKpiQueryKey({ kpiId: "kpi1" });
  const queryFn = jest.fn(async () => ({ count: 1 }));
  client.setQueryData(key, { count: 0 });
  const observer = new QueryObserver(client, { queryKey: key, queryFn, staleTime: Infinity });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await invalidateKpiCommentQueries(client, context, "none");
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(queryFn).not.toHaveBeenCalled();
    await invalidateKpiCommentQueries(client, context, "active");
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(key)).toEqual({ count: 1 });
  } finally {
    unsubscribe();
    client.clear();
  }
});
