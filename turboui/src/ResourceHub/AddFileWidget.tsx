import * as React from "react";
import { useEffect, useState } from "react";
import * as Forms from "../Forms";
import Modal from "../Modal";
import { ProgressBar } from "../ProgressBar";
import { emptyContent } from "../RichContent/contentOps";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { IconX } from "../icons";
import { SubscribersSelector } from "../Subscriptions";
import { FileIcon } from "./NodeIcon";
import { createFileItemId, findNameAndExtension } from "./utils";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export interface AddFileUploadItem {
  name: string;
  nameWithExtension: string;
  extension: string;
  description: unknown;
  mainFile: File;
  previewFile?: File;
  fileType: string;
}

export interface AddFileWidgetProps {
  subscriptions: SubscribersSelector.Props;
  richTextHandlers: RichEditorHandlers;
  formatFileSize: (size: number) => string;
  onUpload: (items: AddFileUploadItem[], onProgress: (progress: number) => void) => Promise<void>;
}

function descriptionDraftKey(item: PayloadItem): string {
  return `resource-hub-add-file:${item.id}`;
}

// Explicitly purges any local drafts for the given rows' description fields.
// This is defense-in-depth on top of `PayloadItem.id`-scoped draft keys: even
// if this cleanup were ever skipped, a newly dropped file always gets a fresh
// id (and therefore a fresh draft key), so it can never inherit another
// file's leftover note. Doing this explicitly also means the note disappears
// immediately (Cancel / successful upload) rather than only after the local
// draft's TTL expires.
function clearDescriptionDrafts(items: PayloadItem[]): void {
  items.forEach((item, idx) => {
    Forms.clearRichTextAreaDraft({ field: `items[${idx}].description`, draftKey: descriptionDraftKey(item) });
  });
}

export function AddFileWidget({ subscriptions, richTextHandlers, formatFileSize, onUpload }: AddFileWidgetProps) {
  const { files, setFiles, filesSelected } = useNewFileModalsContext();
  const [progress, setProgress] = useState(0);

  const form = Forms.useForm({
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
    cancel: () => {
      clearDescriptionDrafts(form.values.items as PayloadItem[]);
      setFiles(undefined);
    },
    submit: async () => {
      const currentItems = form.values.items as PayloadItem[];
      const items = currentItems.map((item) => item.toUploadItem());

      await onUpload(items, setProgress);

      clearDescriptionDrafts(currentItems);
      setFiles(undefined);
    },
  });

  useEffect(() => {
    if (form && files) {
      const initialFileItems = files.map((file) => new PayloadItem(file));
      form.actions.setValue("items", initialFileItems);
      setProgress(0);
    }
    // Intentionally omit `form`: it is a new object each render and would reset upload progress.
  }, [files]);

  if (form.state === "submitting") {
    return <UploadingModal progress={progress} isOpen={filesSelected} />;
  }

  if (!filesSelected) return null;

  return (
    <div className="border border-surface-outline shadow-lg p-8 rounded-lg">
      <Forms.Form form={form}>
        <Files field="items" formatFileSize={formatFileSize} richTextHandlers={richTextHandlers} />

        <div className="mt-4" />
        <SubscribersSelector {...subscriptions} />

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </div>
  );
}

function Files({
  field,
  formatFileSize,
  richTextHandlers,
}: {
  field: string;
  formatFileSize: (size: number) => string;
  richTextHandlers: RichEditorHandlers;
}) {
  const [items = []] = Forms.useFieldValue<PayloadItem[]>(field);

  return (
    <div>
      {items.map((_, i) => (
        <FileForm key={i} index={i} formatFileSize={formatFileSize} richTextHandlers={richTextHandlers} />
      ))}
    </div>
  );
}

function FileForm({
  index,
  formatFileSize,
  richTextHandlers,
}: {
  index: number;
  formatFileSize: (size: number) => string;
  richTextHandlers: RichEditorHandlers;
}) {
  const [item] = Forms.useFieldValue<PayloadItem>(`items[${index}]`);
  const { setFiles } = useNewFileModalsContext();

  if (!item) {
    return null;
  }

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
        <Forms.FieldGroup layout="vertical">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Forms.TextInput field={`items[${index}].name`} />
            </div>
          </div>

          <Forms.RichTextArea
            field={`items[${index}].description`}
            draftKey={descriptionDraftKey(item)}
            placeholder="Leave notes here..."
            richTextHandlers={richTextHandlers}
            height="min-h-[80px]"
          />
          <FileDetails file={item.mainFile} formatFileSize={formatFileSize} />
        </Forms.FieldGroup>
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

function UploadingModal({ progress, isOpen }: { progress: number; isOpen: boolean }) {
  const { files } = useNewFileModalsContext();
  const text = files?.length === 1 ? "Uploading file" : "Uploading files";

  return (
    <Modal isOpen={isOpen} onClose={() => undefined} closeOnBackdropClick={false}>
      <div className="text-center">{text}</div>
      <div className="mt-2">
        <ProgressBar progress={progress} status="pending" />
      </div>
    </Modal>
  );
}

class PayloadItem {
  readonly id: string = createFileItemId();
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
