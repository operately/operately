const MIN_COLUMN_WIDTH = 64;

/** Keep equal shares where possible, giving wider content only the extra space it needs. */
export function allocateColumnWidths(naturalWidths: number[], availableWidth: number): number[] {
  const widths = naturalWidths.map(() => 0);
  let remaining = naturalWidths.map((width, index) => ({ width: Math.max(MIN_COLUMN_WIDTH, width), index }));
  let space = Math.max(availableWidth, remaining.length * MIN_COLUMN_WIDTH);
  const contentFits = remaining.reduce((sum, { width }) => sum + width, 0) <= space;

  while (remaining.length) {
    const share = space / remaining.length;
    // If everything fits, cap wider columns at their needs and share the surplus.
    // Otherwise, shrink short columns so constrained columns can share the available space.
    const needsNaturalWidth = ({ width }: { width: number }) => (contentFits ? width > share : width < share);
    const fixed = remaining.filter(needsNaturalWidth);
    if (fixed.length === 0) {
      remaining.forEach(({ index }) => {
        widths[index] = share;
      });
      break;
    }
    fixed.forEach(({ width, index }) => {
      widths[index] = width;
      space -= width;
    });
    remaining = remaining.filter((column) => !needsNaturalWidth(column));
  }

  return widths;
}
