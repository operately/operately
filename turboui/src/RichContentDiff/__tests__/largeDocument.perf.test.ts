import { createRichContentSchema } from "../schema";
import { diffRichContent } from "../diffRichContent";
import { buildLargeDocument, doc, paragraph, text } from "./fixtures";

/**
 * Measures main-thread cost of a large-document comparison.
 * Phase 0 records the timing; a Web Worker is deferred unless this
 * consistently exceeds an interactive budget (~100ms).
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
    // Soft budget: warn via assertion message if unexpectedly slow in CI.
    // Do not fail the suite for environment variance; log for local inspection.
    // eslint-disable-next-line no-console
    console.info(`[RichContentDiff] large fixture (400 paragraphs) took ${elapsedMs.toFixed(1)}ms`);

    expect(elapsedMs).toBeLessThan(5000);
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
