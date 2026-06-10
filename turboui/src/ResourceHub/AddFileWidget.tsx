import * as React from "react";
import { useEffect, useState } from "react";
import { ProgressBar } from "../ProgressBar";
import { emptyContent } from "../RichContent/contentOps";
import { IconX } from "../icons";
import { SubscribersSelector } from "../Subscriptions";
import { FileIcon } from "./NodeIcon";
import { findNameAndExtension } from "./utils";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import type { ResourceHubFormsApi, ResourceHubModalApi } from "./types";

export interface AddFileUploadItem {
  name: string;
  nameWithExtension: string;
  extension: string;
  description: unknown;
  mainFile: File;
  previewFile?: File;
  fileType: string;
}

export interface AddFileWidgetFormsApi extends ResourceHubFormsApi {
  RichTextArea: React.ComponentType<{
    field: string;
    placeholder?: string;
    mentionSearchScope: { type: string; id: string };
    height?: string;
  }>;
  FieldGroup: React.ComponentType<{ layout?: string; children: React.ReactNode }>;
}

export interface AddFileWidgetProps {
  forms: AddFileWidgetFormsApi;
  modal: ResourceHubModalApi;
  subscriptions: SubscribersSelector.Props;
  mentionSearchScope: { type: string; id: string };
  formatFileSize: (size: number) => string;
  onUpload: (items: AddFileUploadItem[], onProgress: (progress: number) => void) => Promise<void>;
}

export function AddFileWidget({ forms, modal, subscriptions, mentionSearchScope, formatFileSize, onUpload }: AddFileWidgetProps) {
  const { files, setFiles, filesSelected } = useNewFileModalsContext();
  const [progress, setProgress] = useState(0);

  const form = forms.useForm({
    fields: {
      items: [],
    },
    validate: (addError: (field: string, message: string) => void) => {
      (form.values.items as PayloadItem[]).forEach((item, idx) => {
        if (!item.name) {
          addError(`items[${idx}].name`, "Name is required");
        }
      });
    },
    cancel: () => setFiles(undefined),
    submit: async () => {
      const items = (form.values.items as PayloadItem[]).map((item) => item.toUploadItem());
      await onUpload(items, setProgress);
      setFiles(undefined);
    },
  });

  useEffect(() => {
    if (form && files) {
      const initialFileItems = files.map((file) => new PayloadItem(file));
      form.actions.setValue("items", initialFileItems);
      setProgress(0);
    }
  }, [files, form]);

  if (form.state === "submitting") {
    return <UploadingModal modal={modal} progress={progress} isOpen={filesSelected} />;
  }

  if (!filesSelected) return null;

  return (
    <div className="border border-surface-outline shadow-lg p-8 rounded-lg">
      <forms.Form form={form}>
        <Files forms={forms} formatFileSize={formatFileSize} mentionSearchScope={mentionSearchScope} field="items" />

        <div className="mt-4" />
        <SubscribersSelector {...subscriptions} />

        <forms.Submit cancelText="Cancel" />
      </forms.Form>
    </div>
  );
}

function Files({
  field,
  forms,
  formatFileSize,
  mentionSearchScope,
}: {
  field: string;
  forms: AddFileWidgetFormsApi;
  formatFileSize: (size: number) => string;
  mentionSearchScope: { type: string; id: string };
}) {
  const [items] = forms.useFieldValue<PayloadItem[]>(field);

  return (
    <div>
      {items.map((_, i) => (
        <FileForm
          key={i}
          index={i}
          forms={forms}
          formatFileSize={formatFileSize}
          mentionSearchScope={mentionSearchScope}
        />
      ))}
    </div>
  );
}

function FileForm({
  index,
  forms,
  formatFileSize,
  mentionSearchScope,
}: {
  index: number;
  forms: AddFileWidgetFormsApi;
  formatFileSize: (size: number) => string;
  mentionSearchScope: { type: string; id: string };
}) {
  const [item] = forms.useFieldValue<PayloadItem>(`items[${index}]`);
  const { setFiles } = useNewFileModalsContext();

  const removeFile = () => {
    setFiles((currentFiles) => {
      currentFiles?.splice(index, 1);
      return currentFiles ? [...currentFiles] : undefined;
    });
  };

  return (
    <div className="border border-stroke-base p-4 rounded-lg mb-4 flex items-start gap-4 relative">
      <FileIcon size={60} filetype={item.fileType} />

      <div className="flex-1">
        <forms.FieldGroup layout="vertical">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <forms.TextInput field={`items[${index}].name`} />
            </div>
          </div>

          <forms.RichTextArea
            field={`items[${index}].description`}
            placeholder="Leave notes here..."
            mentionSearchScope={mentionSearchScope}
            height="min-h-[80px]"
          />
          <FileDetails file={item.mainFile} formatFileSize={formatFileSize} />
        </forms.FieldGroup>
      </div>

      <div className="absolute -top-3 -right-3 rounded-full bg-red-500 text-white-1 p-1" onClick={removeFile}>
        <IconX className="cursor-pointer" size={20} />
      </div>
    </div>
  );
}

function FileDetails({ file, formatFileSize }: { file: File; formatFileSize: (size: number) => string }) {
  return (
    <div className="flex gap-4 items-center text-sm">
      <div>
        <b>File:</b> {file.name}
      </div>
      <div>&middot;</div>
      <div>
        <b>Size:</b> {formatFileSize(file.size)}
      </div>
    </div>
  );
}

function UploadingModal({
  modal,
  progress,
  isOpen,
}: {
  modal: ResourceHubModalApi;
  progress: number;
  isOpen: boolean;
}) {
  const { Modal } = modal;
  const { files } = useNewFileModalsContext();
  const text = files?.length === 1 ? "Uploading file" : "Uploading files";

  return (
    <Modal isOpen={isOpen}>
      <div className="text-center">{text}</div>
      <div className="mt-2">
        <ProgressBar progress={progress} status="pending" />
      </div>
    </Modal>
  );
}

class PayloadItem {
  mainFile: File;
  previewFile?: File;
  name: string;
  extension: string;
  description: unknown;

  constructor(file: File) {
    this.mainFile = file;
    this.description = emptyContent();
    this.setNameAndExtension(file.name);
  }

  get fileType() {
    const fileType = this.mainFile.type;
    const pieces = fileType.split("/");

    if (pieces.length === 2) {
      return pieces[pieces.length - 1]!;
    }

    return fileType;
  }

  get nameWithExtension() {
    if (!this.extension) return this.name;

    return [this.name, this.extension].join(".");
  }

  toUploadItem(): AddFileUploadItem {
    return {
      name: this.name,
      nameWithExtension: this.nameWithExtension,
      extension: this.extension,
      description: this.description,
      mainFile: this.mainFile,
      previewFile: this.previewFile,
      fileType: this.fileType,
    };
  }

  private setNameAndExtension(fileName: string) {
    const { name, extension } = findNameAndExtension(fileName);

    this.name = name;
    this.extension = extension;
  }
}
