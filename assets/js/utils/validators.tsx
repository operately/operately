import * as TipTapEditor from "@/components/Editor";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

export class Validators {
  public static nonEmptyNumber(value: number | null | undefined): boolean {
    return value !== null && value !== undefined;
  }

  public static nonEmptyString(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  public static nonEmptyRichText(editor: TipTapEditor.EditorState): boolean {
    return !isContentEmpty(editor.editor.getJSON());
  }
}
