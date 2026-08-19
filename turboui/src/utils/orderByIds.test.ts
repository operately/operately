import { orderByIds } from "./orderByIds";

test("orders items by the given id list and keeps unknown ids at the end", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  expect(orderByIds(items, ["c", "a"]).map((item) => item.id)).toEqual(["c", "a", "b"]);
});
