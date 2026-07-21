import { createRichContentSchema } from "../schema";
import { diffRichContent } from "../diffRichContent";
import { buildLargeDocument, doc, paragraph, text } from "./fixtures";

const LARGE_DOCUMENT_REGRESSION_CEILING_MS = 1_000;

/**
 * Measures the algorithm cost of a representative large-document comparison.
 * This is a coarse regression guard; CI timing does not prove a browser
 * interaction budget because it excludes rendering and varies by runner.
 */
describe("large document diff performance", () => {
  const schema = createRichContentSchema();

  test("times a representative large-document comparison", () => {
    const before = buildLargeDocument(400);
    const after = buildLargeDocument(400);
    // Introduce a distant edit so the changeset does real work.
    after.content![50] = paragraph(text("Edited section in a large document"));

    const started = performance.now();
    const result = diffRichContent(schema, before, after);
    const elapsedMs = performance.now() - started;

    expect(result.ok).toBe(true);
    // Keep representative timing visible for local and CI inspection.
    // eslint-disable-next-line no-console
    console.info(`[RichContentDiff] large fixture (400 paragraphs) took ${elapsedMs.toFixed(1)}ms`);

    expect(elapsedMs).toBeLessThan(LARGE_DOCUMENT_REGRESSION_CEILING_MS);
    expect(result.ok && result.changes.length).toBeGreaterThan(0);
  });

  test("full replacement of a large document still returns changes", () => {
    const before = buildLargeDocument(200);
    const after = doc(paragraph(text("Tiny replacement")));
    const result = diffRichContent(schema, before, after);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.changes.length).toBeGreaterThan(0);
    }
  });
});
