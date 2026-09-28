import type { Node } from "@tiptap/pm/model";
import { allocateColumnWidths } from "../tableWidths";

/** Measures rendered cell formatting without putting computed widths into the document. */
export class TableLayout {
  private frame: number | undefined;
  private observer: ResizeObserver | undefined;
  private destroyed = false;

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
    wrapper.ownerDocument.fonts?.addEventListener("loadingdone", this.schedule);
    void wrapper.ownerDocument.fonts?.ready.then(() => this.schedule());
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

    // A hidden table keeps the same fonts/marks but removes wrapping and computed columns.
    const measure = this.table.cloneNode(true) as HTMLTableElement;
    measure.removeAttribute("id");
    measure.setAttribute("aria-hidden", "true");
    measure.querySelectorAll("colgroup").forEach((element) => element.remove());
    Object.assign(measure.style, {
      position: "fixed",
      left: "-100000px",
      top: "0",
      visibility: "hidden",
      pointerEvents: "none",
      tableLayout: "auto",
      width: "max-content",
      minWidth: "0",
      maxWidth: "none",
    });
    measure.querySelectorAll<HTMLElement>("td, th").forEach((cell) => {
      cell.style.whiteSpace = "pre";
    });
    this.wrapper.appendChild(measure);
    const naturalWidths = Array.from(measure.rows[0]?.cells ?? [], (cell) => cell.getBoundingClientRect().width);
    measure.remove();

    // Collapsed outer borders sit outside the column widths; reserve their pixel to avoid clipping.
    const cell = this.table.rows[0]?.cells[0];
    const border = cell ? parseFloat(getComputedStyle(cell).borderLeftWidth) || 0 : 0;
    // On mobile, prefer horizontal scrolling over columns too narrow for readable text.
    const viewportWidth = this.wrapper.ownerDocument.defaultView?.innerWidth ?? 768;
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

  destroy() {
    this.destroyed = true;
    const win = this.wrapper.ownerDocument.defaultView;
    if (this.frame !== undefined) win?.cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    win?.removeEventListener("resize", this.schedule);
    this.wrapper.ownerDocument.fonts?.removeEventListener("loadingdone", this.schedule);
  }
}

function supportsAutomaticWidths(table: Node): boolean {
  return table.content.content.every((row) =>
    row.content.content.every(
      (cell) => cell.attrs.colspan === 1 && cell.attrs.rowspan === 1 && cell.attrs.colwidth == null,
    ),
  );
}
