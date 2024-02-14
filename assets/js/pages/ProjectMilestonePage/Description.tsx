import * as React from "react";
import * as TipTapEditor from "@/components/Editor";

import RichContent from "@/components/RichContent";
import Button from "@/components/Button";

import { FilledButton } from "@/components/Button";

export function Description({ milestone, form }) {
  return (
    <div className="">
      <div className="flex items-center justify-left">
        <div className="font-bold -mt-[66px] bg-yellow-300 rounded px-2 tracking-wide text-sm">Description</div>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <DescriptionContent milestone={milestone} form={form} />
        </div>
      </div>
    </div>
  );
}

function DescriptionContent({ milestone, form }) {
  if (form.description.state === "edit") {
    return <DescriptionEdit form={form} />;
  } else {
    if (milestone.description) {
      return <DescriptionFilled milestone={milestone} />;
    } else {
      return <DescriptionZeroState form={form} />;
    }
  }
}

function DescriptionZeroState({ form }) {
  return (
    <div>
      <div className="text-content-dimmed text-sm">No description yet</div>

      <div className="font-semibold mt-1 text-sm">
        <ButtonLink onClick={form.description.startEditing} data-test-id="write-milestone-description">
          Add description
        </ButtonLink>
      </div>
    </div>
  );
}

function DescriptionFilled({ milestone }) {
  return (
    <div>
      <RichContent jsonContent={milestone.description} />
    </div>
  );
}

function DescriptionEdit({ form }) {
  return (
    <div className="border-x border-b border-stroke-base rounded" data-test-id="milestone-description-editor">
      <TipTapEditor.Root editor={form.description.editor}>
        <TipTapEditor.Toolbar editor={form.description.editor} />

        <div className="p-2">
          <TipTapEditor.EditorContent editor={form.description.editor} className="min-h-[200px]" />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                onClick={form.description.submit}
                loading={form.description.submitting}
                disabled={!form.description.submittable}
                variant="success"
                data-test-id="save-milestone-description"
                size="small"
              >
                {form.description.submittable ? "Save" : "Uploading..."}
              </Button>

              <Button variant="secondary" size="small" onClick={form.description.cancelEditing}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
