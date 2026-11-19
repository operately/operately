import { format } from "date-fns";
import { resolveTemplatePreviewDate } from "./previewData";

test("current and future periods resolve without mutating the reference date", () => {
  expect(format(resolveTemplatePreviewDate("2032-02-29", "monthly", 0), "yyyy-MM-dd")).toBe("2032-02-01");
  expect(format(resolveTemplatePreviewDate("2032-02-29", "monthly", 1), "yyyy-MM-dd")).toBe("2032-03-01");
  expect(format(resolveTemplatePreviewDate("2031-01-05", "weekly", 0), "yyyy-MM-dd")).toBe("2030-12-30");
});
