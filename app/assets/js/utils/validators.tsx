import * as TipTapEditor from "@/components/Editor";
import { isContentEmpty } from "turboui";

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

export function isValidURL(url: string) {
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}
