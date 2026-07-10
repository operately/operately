import { canExecuteEditorCommand } from "./canExecuteEditorCommand";

describe("canExecuteEditorCommand", () => {
  it("returns false when the editor is missing", () => {
    expect(canExecuteEditorCommand(null, (can) => can.undo())).toBe(false);
    expect(canExecuteEditorCommand(undefined, (can) => can.undo())).toBe(false);
  });

  it("returns false when the editor is destroyed without calling can()", () => {
    const can = jest.fn();
    const editor = { isDestroyed: true, can } as any;

    expect(canExecuteEditorCommand(editor, (chain) => chain.undo())).toBe(false);
    expect(can).not.toHaveBeenCalled();
  });

  it("delegates to the provided check when the editor is active", () => {
    const editor = {
      isDestroyed: false,
      can: () => ({ undo: () => true, redo: () => false }),
    } as any;

    expect(canExecuteEditorCommand(editor, (can) => can.undo())).toBe(true);
    expect(canExecuteEditorCommand(editor, (can) => can.redo())).toBe(false);
  });
});
