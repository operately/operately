import type { Node } from "@tiptap/pm/model";
import { allocateColumnWidths } from "../tableWidths";

/** Measures rendered cell formatting without putting computed widths into the document. */
export class TableLayout {
  private frame: number | undefined;
  private observer: ResizeObserver | undefined;
  private destroyed = false;
  private cellWidths = new WeakMap<Node, number>();
  private measuredContainerWidth = 0;
  private measuredViewportWidth = 0;

  constructor(
    private wrapper: HTMLElement,
    private table: HTMLTableElement,
    private node: () => Node,
  ) {
    const win = wrapper.ownerDocument.defaultView;
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.schedule());
      this.observer.observe(wrapper);
    }
    win?.addEventListener("resize", this.schedule);
    wrapper.ownerDocument.fonts?.addEventListener("loadingdone", this.invalidateMeasurements);
    void wrapper.ownerDocument.fonts?.ready.then(() => this.invalidateMeasurements());
    this.schedule();
  }

  schedule = () => {
    if (this.destroyed || this.frame !== undefined) return;
    this.frame = this.wrapper.ownerDocument.defaultView?.requestAnimationFrame(() => {
      this.frame = undefined;
      this.update();
    });
  };

  private update() {
    if (!this.wrapper.isConnected || !supportsAutomaticWidths(this.node())) return;
    const available = this.wrapper.clientWidth;
    if (!available || !this.table.rows.length) return;

    const viewportWidth = this.wrapper.ownerDocument.defaultView?.innerWidth ?? 768;
    if (available !== this.measuredContainerWidth || viewportWidth !== this.measuredViewportWidth) {
      this.cellWidths = new WeakMap();
      this.measuredContainerWidth = available;
      this.measuredViewportWidth = viewportWidth;
    }
    const naturalWidths = this.measureColumnWidths();

    // Collapsed outer borders sit outside the column widths; reserve their pixel to avoid clipping.
    const cell = this.table.rows[0]?.cells[0];
    const border = cell ? parseFloat(getComputedStyle(cell).borderLeftWidth) || 0 : 0;
    // On mobile, prefer horizontal scrolling over columns too narrow for readable text.
    const minimumWidth = viewportWidth < 768 ? 160 : undefined;
    const widths = allocateColumnWidths(naturalWidths, available - border, minimumWidth);
    const columns = this.table.querySelectorAll<HTMLElement>("colgroup > col");
    widths.forEach((width, index) => {
      const col = columns[index];
      if (col) {
        col.style.width = `${width}px`;
        col.style.minWidth = "";
      }
    });
    this.table.style.width = `${widths.reduce((sum, width) => sum + width, border)}px`;
    this.table.style.minWidth = "";
  }

  private invalidateMeasurements = () => {
    this.cellWidths = new WeakMap();
    this.schedule();
  };

  private measureColumnWidths(): number[] {
    const pending: { node: Node; cell: HTMLTableCellElement }[] = [];
    this.node().forEach((row, _offset, rowIndex) => {
      row.forEach((node, _offset, column) => {
        if (this.cellWidths.has(node)) return;
        const cell = this.table.rows[rowIndex]?.cells[column];
        if (cell) pending.push({ node, cell });
      });
    });
    this.measureCells(pending);

    const widths: number[] = [];
    this.node().forEach((row) => {
      row.forEach((cell, _offset, column) => {
        widths[column] = Math.max(widths[column] ?? 0, this.cellWidths.get(cell) ?? 0);
      });
    });
    return widths;
  }

  /** Immutable cell nodes let ordinary typing reuse every unchanged cell's measurement. */
  private measureCells(pending: { node: Node; cell: HTMLTableCellElement }[]) {
    if (!pending.length) return;
    const container = this.wrapper.ownerDocument.createElement("div");
    container.setAttribute("aria-hidden", "true");
    Object.assign(container.style, {
      position: "fixed",
      left: "-100000px",
      top: "0",
      visibility: "hidden",
      pointerEvents: "none",
    });
    const measurements = pending.map(({ node, cell }) => {
      // Isolate each cell so another column cannot stretch its natural width.
      const table = this.table.cloneNode(false) as HTMLTableElement;
      table.removeAttribute("id");
      Object.assign(table.style, { tableLayout: "auto", width: "max-content", minWidth: "0", maxWidth: "none" });
      const clone = cell.cloneNode(true) as HTMLTableCellElement;
      clone.style.whiteSpace = "pre";
      table.createTBody().insertRow().appendChild(clone);
      container.appendChild(table);
      return { node, clone };
    });
    this.wrapper.appendChild(container);
    try {
      // Batch DOM writes before geometry reads to force layout only once.
      measurements.forEach(({ node, clone }) => this.cellWidths.set(node, clone.getBoundingClientRect().width));
    } finally {
      container.remove();
    }
  }

  destroy() {
    this.destroyed = true;
    const win = this.wrapper.ownerDocument.defaultView;
    if (this.frame !== undefined) win?.cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    win?.removeEventListener("resize", this.schedule);
    this.wrapper.ownerDocument.fonts?.removeEventListener("loadingdone", this.invalidateMeasurements);
  }
}

function supportsAutomaticWidths(table: Node): boolean {
  return table.content.content.every((row) =>
    row.content.content.every(
      (cell) => cell.attrs.colspan === 1 && cell.attrs.rowspan === 1 && cell.attrs.colwidth == null,
    ),
  );
}
