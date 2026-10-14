import type {
  CuratedTemplate,
  TemplateInput,
  TemplateSaveIntent,
  TemplateMutationResult,
  TemplateValidationError,
} from "../types";

export interface TemplateEditorProps {
  validationErrors?: TemplateValidationError[];
  template?: CuratedTemplate;
  onSave: (input: TemplateInput, intent: TemplateSaveIntent) => Promise<TemplateMutationResult>;
  onCancel: () => void;
}
export interface TemplateDetailProps extends TemplateEditorProps {
  onSavePreviewData?: (previewData: string) => Promise<TemplateMutationResult>;
  catalogPath: string;
  previewPath?: string;
  onDelete: () => Promise<void>;
}
