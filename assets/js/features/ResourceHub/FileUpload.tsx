import React from "react";
import Forms from "@/components/Forms";
import { FileIcon } from "./NodeIcon";

import * as Icons from "@tabler/icons-react";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";

export function FileUpload() {
  const form = Forms.useForm({
    fields: {
      files: [
        {
          name: "Jan 2022 Report",
          extension: "txt",
          size: 12345,
          type: "text/plain",
          description: "This is a preliminary report for January 2026.",
        },
        {
          name: "Expense Report",
          extension: "pdf",
          size: 23456,
          type: "text/plain",
          description: "",
        },
        {
          name: "Video Explanation",
          extension: "mp4",
          size: 34567,
          type: "text/plain",
          description: "",
        },
      ],
    },
    submit: async () => {
      // todo
    },
    cancel: async () => {
      // todo
    },
  });

  return (
    <div className="border border-surface-outline shadow-lg p-8 rounded-lg">
      <Forms.Form form={form}>
        <Files field="files" />
        <div className="bg-surface-dimmed p-4 h-24">Who to notify widget placeholder</div>
        <Forms.Submit saveText="Save" buttonSize="base" submitOnEnter={false} />
      </Forms.Form>
    </div>
  );
}

interface File {
  name: string;
  extension: string;
  size: number;
  type: string;
}

function Files({ field }) {
  const [files, setFiles] = Forms.useFieldValue<File[]>(field);

  return (
    <div>
      <div>
        {files.map((_, i) => (
          <FileForm key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

function FileForm({ index }) {
  const [file] = Forms.useFieldValue<File>(`files[${index}]`);

  return (
    <div className="border border-stroke-base p-4 rounded-lg mb-4 flex items-start gap-4 relative">
      <FileIcon size={60} filetype={file.extension} />

      <div className="flex-1">
        <Forms.FieldGroup layout="vertical">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Forms.TextInput field={`files[${index}].name`} />
            </div>
          </div>

          <Forms.RichTextArea
            field={`files[${index}].description`}
            placeholder="Leave notes here..."
            mentionSearchScope={{ type: "resource_hub", id: "123" }}
            height="min-h-[80px]"
          />
        </Forms.FieldGroup>
      </div>

      <div className="absolute -top-3 -right-3 rounded-full bg-red-500 text-white-1 p-1">
        <Icons.IconX className="cursor-pointer" size={20} />
      </div>
    </div>
  );
}
