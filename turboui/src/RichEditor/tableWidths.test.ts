import { allocateColumnWidths } from "./tableWidths";

describe("table column widths", () => {
  it("gives a short column only the space it needs", () => {
    expect(allocateColumnWidths([80, 800], 600)).toEqual([80, 520]);
  });

  it("shares space equally between columns that both need it", () => {
    expect(allocateColumnWidths([800, 1000], 600)).toEqual([300, 300]);
  });

  it("redistributes space until every short column fits naturally", () => {
    expect(allocateColumnWidths([80, 200, 1000], 600)).toEqual([80, 200, 320]);
  });

  it("keeps equal widths when all content fits within equal shares", () => {
    expect(allocateColumnWidths([80, 100], 600)).toEqual([300, 300]);
    expect(allocateColumnWidths([100, 100], 600)).toEqual([300, 300]);
    expect(allocateColumnWidths([100, 0, 0], 600)).toEqual([200, 200, 200]);
    expect(allocateColumnWidths([100, 100, 0], 600)).toEqual([200, 200, 200]);
  });

  it("gives a column extra space only up to its content's needs", () => {
    expect(allocateColumnWidths([80, 400], 600)).toEqual([200, 400]);
    expect(allocateColumnWidths([350, 80, 80], 600)).toEqual([350, 125, 125]);
    expect(allocateColumnWidths([350, 150, 80], 600)).toEqual([350, 150, 100]);
    expect(allocateColumnWidths([400, 0, 0], 500)).toEqual([372, 64, 64]);
  });

  it("keeps empty cells usable and scrolls instead of crushing narrow columns", () => {
    expect(allocateColumnWidths([0, 800], 100)).toEqual([64, 64]);
    expect(allocateColumnWidths([], 600)).toEqual([]);
  });

  it("respects a larger mobile minimum while distributing any remaining space", () => {
    expect(allocateColumnWidths([0, 0, 800], 320, 160)).toEqual([160, 160, 160]);
    expect(allocateColumnWidths([80, 800], 400, 160)).toEqual([160, 240]);
  });
});
