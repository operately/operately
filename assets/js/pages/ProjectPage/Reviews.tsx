import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Icons from "@tabler/icons-react";
import * as Project from "@/graphql/Projects";
import * as People from "@/graphql/People";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

import { Spacer } from "@/components/Spacer";

import { useNavigate } from "react-router-dom";

export default function Reviews({ me, project }) {
  return (
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-content-accent leading-none">Project Reviews</div>
      <div className="text-content-dimmed max-w-xl">Assessments of the state of the project after each project phase.</div>

      <Spacer size={0.25} />
      <ReviewList project={project} />

      <Spacer size={0.25} />
      <NextReviewSchedule project={project} />

      <RequestReviewButton me={me} project={project} />
    </div>
  );
}

function RequestReviewButton({ me, project }) {
  const navigate = useNavigate();
  const navigateToRequestReview = () => navigate(`/projects/${project.id}/reviews/request/new`);

  if (Project.hasReviewRequest(project)) {
    return null;
  }

  if (me.id !== project.reviewer?.id) {
    return null;
  }

  return (
    <>
      <Spacer size={0.25} />
      <div>
        <Button variant="secondary" data-test-id="request-review-button" onClick={navigateToRequestReview}>
          Request impromptu review
        </Button>
      </div>
    </>
  );
}

function ReviewList({ project }) {
  const { data, loading } = Updates.useListUpdates({
    fetchPolicy: "network-only",
    variables: {
      filter: {
        projectId: project.id,
      },
    },
  });

  if (loading) {
    return <div></div>;
  }

  let reviews = data.updates.filter((update: Updates.Update) => update.messageType === "review") as Updates.Update[];
  reviews = reviews.sort((a, b) => (a.insertedAt < b.insertedAt ? -1 : 1));

  if (!reviews.length) {
    return <ReviewEmptyState />;
  }

  return <ReviewTable reviews={reviews} project={project} />;
}

function ReviewEmptyState() {
  return <div className="text-content-dimmed">No reviews have been submitted for this project.</div>;
}

function ReviewTable({ reviews, project }: { reviews: Updates.Update[]; project: Project.Project }) {
  return (
    <div className="flex flex-col gap-1">
      {reviews.map((review) => (
        <ReviewRow key={review.id} review={review} project={project} />
      ))}
    </div>
  );
}

function ReviewRow({ review, project }: { review: Updates.Update; project: Project.Project }) {
  const navigate = useNavigate();
  const navigateToReview = () => navigate(`/projects/${project.id}/reviews/${review.id}`);

  const content = review.content as UpdateContent.Review;
  const author = review.author;

  return (
    <div
      className="flex flex-row justify-between items-center bg-dark-4 hover:bg-dark-5 p-2 rounded cursor-pointer"
      onClick={navigateToReview}
    >
      <div className="flex gap-2 items-center">
        <Avatar person={author} size="tiny" />
        <div className="font-medium text-content-accent capitalize">
          <ReviewTitle review={content} />
        </div>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <FormattedTime time={review.insertedAt} format="short-date" />
        <AckMarker update={review} />
      </div>
    </div>
  );
}

function ReviewTitle({ review }) {
  if (review.reviewReason === "review_request") {
    return <>Impromptu Review</>;
  } else {
    return (
      <>
        {review.previousPhase} to {review.newPhase} Review
      </>
    );
  }
}

function AckMarker({ update }) {
  if (update.acknowledged) {
    return <Icons.IconCircleCheckFilled size={16} className="text-green-400" data-test-id="acknowledged-marker" />;
  } else {
    return <Icons.IconCircleCheckFilled size={16} className="text-content-subtle" />;
  }
}

function NextReviewSchedule({ project }) {
  const currentPhase = project.phaseHistory.find((phase) => phase.phase === project.phase);

  if (project.phase === "completed") return <div></div>;
  if (!currentPhase) return <div></div>;

  if (Project.hasReviewRequest(project)) {
    return <NextReviewScheduleBasedOnRequest project={project} reviewRequest={project.reviewRequests[0]} />;
  }

  if (!currentPhase.dueTime) {
    return <NextReviewScheduleBasedOnPhaseWithNoDueDate currentPhase={currentPhase} />;
  }

  return <NextReviewScheduleBasedOnPhaseWithDueDate currentPhase={currentPhase} />;
}

function NextReviewScheduleBasedOnRequest({ project, reviewRequest }) {
  const navigate = useNavigate();

  const path = `/projects/${project.id}/reviews/request/${reviewRequest.id}`;
  const author = reviewRequest.author;
  const time = reviewRequest.insertedAt;

  const navigateToReviewRequest = () => navigate(path);

  return (
    <div
      className="flex flex-row justify-between items-center p-2 rounded cursor-pointer bg-blue-600 hover:bg-blue-500 transition-colors"
      onClick={navigateToReviewRequest}
      data-test-id="request-review-link"
    >
      <div className="flex gap-2 items-center">
        <Avatar person={author} size="tiny" />
        <div className="font-medium text-content-accent">{People.firstName(author)} requested an Impromptu Review</div>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <FormattedTime time={time} format="short-date-with-weekday-relative" />
        <Icons.IconArrowRight size={20} />
      </div>
    </div>
  );
}

function NextReviewScheduleBasedOnPhaseWithNoDueDate({ currentPhase }) {
  return (
    <div className="flex gap-2 items-center max-w-lg text-content-dimmed">
      The next review is scheduled for when the {currentPhase.phase} phase is completed. Currently, no due date is set.
    </div>
  );
}

function NextReviewScheduleBasedOnPhaseWithDueDate({ currentPhase }) {
  return (
    <div className="flex gap-2 items-center max-w-lg text-content-dimmed">
      The next review is scheduled for <FormattedTime time={currentPhase.dueTime} format="short-date" /> when the{" "}
      {currentPhase.phase} phase is scheduled to end.
    </div>
  );
}
