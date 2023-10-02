import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as ProjectReviewRequests from "@/graphql/ProjectReviewRequests";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Paper from "@/components/PaperContainer";
import * as TipTapEditor from "@/components/Editor";

import Button from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigate } from "react-router-dom";

interface LoaderResult {
  project: Projects.Project;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

export function Page() {
  const navigate = useNavigate();
  const [{ project }] = Paper.useLoadedData() as [LoaderResult];

  useDocumentTitle("Request Project Review");

  const peopleSearch = People.usePeopleSearch();

  const { editor, submittable } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    peopleSearch: peopleSearch,
    className: "min-h-[350px] py-2 px-1",
  });

  const [createRequest, { loading }] = ProjectReviewRequests.useCreateRequest({
    onCompleted: () => navigate(`/projects/${project.id}`),
  });

  const submit = async () => {
    if (!submittable) return;
    if (!editor) return;

    await createRequest({
      variables: {
        input: {
          projectID: project.id,
          content: JSON.stringify(editor.getJSON()),
        },
      },
    });
  };

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="text-white-1 text-2xl font-extrabold">Requesting an Impromptu Review</div>
        <div className="text-white-2">Please provide a brief description of why you are requesting a review.</div>

        <Message editor={editor} />

        <div className="font-bold text-white-1 mt-4">What happens next?</div>
        <div className="max-w-lg mt-2">
          Your request will be sent to the project champion ({project.champion?.fullName}) to fill out the review form
          and assess the current state of the project.
        </div>
        <div className="max-w-lg mt-2">
          Once the review is complete, you will be notified and the review will be available to view on the project
          page.
        </div>

        <Spacer size={4} />

        <Button
          variant="success"
          disabled={!submittable}
          loading={loading}
          data-test-id="request-review-submit-button"
          onClick={submit}
        >
          {submittable ? "Submit Request" : "Uploading..."}
        </Button>
      </Paper.Body>
    </Paper.Root>
  );
}

function Message({ editor }) {
  return (
    <TipTapEditor.Root>
      <TipTapEditor.Toolbar editor={editor} variant="large" />

      <div className="mb-8 text-white-1 relative border-b border-shade-2" style={{ minHeight: "350px" }}>
        <TipTapEditor.EditorContent editor={editor} />
        <TipTapEditor.LinkEditForm editor={editor} />
      </div>
    </TipTapEditor.Root>
  );
}
