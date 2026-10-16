import type {
  CuratedTemplate,
  TemplateInput,
  TemplateSaveIntent,
  TemplateMutationResult,
  TemplateValidationError,
} from "../types";
import type { FormattedTimePreferences } from "../../FormattedTime";

export interface TemplateEditorProps {
  validationErrors?: TemplateValidationError[];
  template?: CuratedTemplate;
  onSave: (input: TemplateInput, intent: TemplateSaveIntent) => Promise<TemplateMutationResult>;
  onCancel: () => void;
}
export interface TemplateDetailProps extends TemplateEditorProps {
  editing?: boolean;
  editPath?: string;
  formattedTimePreferences: FormattedTimePreferences;
  catalogPath: string;
  previewPath?: string;
  onDelete: () => Promise<void>;
}
