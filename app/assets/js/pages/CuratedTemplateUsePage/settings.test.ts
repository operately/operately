import { defaultDestination, todayInTimezone } from "./settings";

test("prefers General only when writable, then a sole space, otherwise requires a choice", () => {
  const spaces = [{ id: "general-123" }, { id: "private-456" }];
  expect(defaultDestination(spaces, "123")).toBe("general-123");
  expect(defaultDestination(spaces, "789")).toBe("");
  expect(defaultDestination([{ id: "private-456" }], "123")).toBe("private-456");
  expect(defaultDestination([], "123")).toBe("");
});

test("start date uses the person's timezone across calendar boundaries", () => {
  const now = new Date("2026-11-01T01:00:00Z");
  expect(todayInTimezone("America/Sao_Paulo", now)).toBe("2026-10-31");
  expect(todayInTimezone("Asia/Tokyo", now)).toBe("2026-11-01");
});
