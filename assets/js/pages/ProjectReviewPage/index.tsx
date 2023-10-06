import React from "react";
import * as Icons from "@tabler/icons-react";

import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Paper from "@/components/PaperContainer";
import * as Feed from "@/features/feed";
import * as ProjectReviewRequests from "@/graphql/ProjectReviewRequests";

import { SurveyAnswers } from "@/components/Survey";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

import { Spacer } from "@/components/Spacer";
import { TextSeparator } from "@/components/TextSeparator";

import { useDocumentTitle } from "@/layouts/header";
import { useAddReaction } from "./useAddReaction";

import { CommentSection } from "./CommentSection";

interface LoaderResult {
  project: Projects.Project;
  review: Updates.Update;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let reviewData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    review: reviewData.data.update,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, review, me }, refetch, fetchVersion] = Paper.useLoadedData() as [LoaderResult, () => void, number];

  const content = review.content as UpdateContent.Review;
  const title = buildTitle(content);

  useDocumentTitle(title);

  const addReactionForm = useAddReaction(review.id, "update", refetch);

  const previousPhase = content.previousPhase;
  const newPhase = content.newPhase;

  return (
    <Paper.Root key={fetchVersion}>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <AckCTA project={project} update={review} refetch={refetch} me={me} />

        <div className="flex flex-col items-center">
          <div className="text-white-1 text-2xl font-extrabold">{title}</div>
          <div className="flex gap-0.5 flex-row items-center mt-1 text-white-1 font-medium">
            <div className="flex items-center gap-2">
              <Avatar person={review.author} size="tiny" /> {review.author.fullName}
            </div>
            <TextSeparator />
            <FormattedTime time={review.insertedAt} format="short-date" />
            <TextSeparator />
            <Acknowledgement review={review} />
          </div>
        </div>

        <Spacer size={4} />

        {content.reviewReason === "phase_change" && (
          <PhaseChangeDescription previousPhase={previousPhase} newPhase={newPhase} />
        )}

        <div className="mt-8 border-b border-dark-8 uppercase text-sm pb-2 mb-2">Project Review</div>

        <Content review={review} />
        <Spacer size={4} />

        {content.reviewReason === "review_request" && <ReviewRequestDescription project={project} review={content} />}

        <Feed.Reactions reactions={review.reactions} size={20} form={addReactionForm} />

        <Spacer size={4} />

        <div className="text-white-1 font-extrabold border-b border-shade-2 pb-2">Comments</div>
        <CommentSection update={review} refetch={refetch} me={me} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Content({ review }: { review: Updates.Update }) {
  const content = review.content as UpdateContent.Review;
  const answers = JSON.parse(content.survey)["answers"];

  return <SurveyAnswers answers={answers} />;
}

function capitalCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Acknowledgement({ review }: { review: Updates.Update }) {
  if (review.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconCircleCheck size={16} className="text-green-400" />
        Acknowledged by {review.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not acknowledged</span>;
  }
}

function AckCTA({
  project,
  update,
  refetch,
  me,
}: {
  project: Projects.Project;
  update: Updates.Update;
  refetch: () => void;
  me: People.Person;
}) {
  const [ack, { loading }] = Updates.useAckUpdate();

  if (update.acknowledged) return null;
  if (!project.reviewer) return null;
  if (project.reviewer.id !== me.id) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: update.id,
      },
    });

    refetch();
  };

  return (
    <div className="px-4 py-3 bg-shade-1 flex items-center justify-between font-bold -mt-4 mb-8 rounded">
      Waiting for your acknowledgement
      <Button variant="success" size="tiny" data-test-id="acknowledge-update" loading={loading} onClick={handleAck}>
        <Icons.IconCheck size={16} className="-mr-1" stroke={3} />
        Acknowledge
      </Button>
    </div>
  );
}

function buildTitle(review: UpdateContent.Review) {
  if (review.reviewReason === "review_request") {
    return "Impromptu Project Review";
  } else {
    return `${capitalCase(review.previousPhase)} to ${capitalCase(review.newPhase)} Review`;
  }
}

function PhaseChangeDescription({ previousPhase, newPhase }) {
  return (
    <>
      <div className="text-white-1">The project has moved to a new phase</div>
      <div className="flex items-center gap-1 font-bold">
        <span className="text-white-1 capitalize">{previousPhase}</span>
        <Icons.IconArrowRight size={16} />
        <span className="text-white-1 capitalize">{newPhase}</span>
      </div>
    </>
  );
}

function ReviewRequestDescription({ project, review }) {
  let { data, loading, error } = useQuery(ProjectReviewRequests.GET_REQUEST, {
    variables: { id: review.reviewRequestId },
    fetchPolicy: "network-only",
  });

  if (loading) return null;
  if (error) throw error;

  let request = data.projectReviewRequest as ProjectReviewRequests.ReviewRequest;

  return (
    <div className="mb-4">
      This review was{" "}
      <Link
        to={`/projects/${project.id}/reviews/request/${request.id}`}
        className="text-blue-400 underline cursor-pointer"
        data-test-id="review-request-link"
      >
        requested
      </Link>{" "}
      by {People.firstName(request.author)}.
    </div>
  );
}
