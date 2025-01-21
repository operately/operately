import React from "react";

import { Discussion } from "@/models/discussions";
import { ResourceHubDocument } from "@/models/resourceHubs";

import { match } from "ts-pattern";
import { IconX } from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";
import { ActionLink } from "@/components/Link";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { GhostButton, PrimaryButton } from "@/components/Buttons";

type Resource = Discussion | ResourceHubDocument;
type State = "actions" | "link";

interface Props {
  resource: Resource;
  editResourcePath: string;
  publish: () => void;
}

export function OngoingDraftActions({ resource, editResourcePath, publish }: Props) {
  if (resource.state !== "draft") return null;

  const [state, setState] = React.useState<State>("actions");

  return match(state)
    .with("actions", () => (
      <ContinueEditingActions
        resource={resource}
        setLinkVisible={() => setState("link")}
        editResourcePath={editResourcePath}
        publish={publish}
      />
    ))
    .with("link", () => <ContinueEditingLink setActionsVisible={() => setState("actions")} />)
    .exhaustive();
}

interface ContinueProps {
  resource: Resource;
  setLinkVisible: () => void;
  editResourcePath: string;
  publish: () => void;
}

function ContinueEditingActions({ resource, setLinkVisible, editResourcePath, publish }: ContinueProps) {
  return (
    <div className="mb-4 bg-surface-dimmed p-4 rounded-2xl">
      <div className="text-center">
        <span className="font-bold">This is an unpublished draft.</span>{" "}
        <span className="">
          Last edit was made <FormattedTime time={resource.updatedAt!} format="relative-time-or-date" />.
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <ContinueEditingButton path={editResourcePath} />
        <PublishNowButton publish={publish} />
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <ActionLink className="font-medium" onClick={setLinkVisible} testId="share-link">
          Share a link
        </ActionLink>
      </div>
    </div>
  );
}

function ContinueEditingLink({ setActionsVisible }: { setActionsVisible: () => void }) {
  return (
    <div className="mb-4 bg-surface-dimmed p-4 rounded-2xl">
      <div className="border border-stoke-base p-4 rounded-2xl relative">
        <div
          className="border border-stroke-base p-1 rounded-full absolute top-4 right-4 cursor-pointer hover:border-surface-outline"
          onClick={setActionsVisible}
        >
          <IconX size={20} />
        </div>

        <p className="mb-1 mt-4">Share this link to this draft with anyone who has access to this space:</p>

        <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between bg-surface-base">
          {window.location.href}

          <CopyToClipboard text={window.location.href} size={25} padding={1} containerClass="" />
        </div>
      </div>
    </div>
  );
}

function ContinueEditingButton({ path }: { path: string }) {
  return (
    <PrimaryButton linkTo={path} size="base" testId="continue-editing">
      Continue editing
    </PrimaryButton>
  );
}

function PublishNowButton({ publish }: { publish: () => void }) {
  return (
    <GhostButton onClick={publish} size="base" testId="publish-now">
      Publish now
    </GhostButton>
  );
}
