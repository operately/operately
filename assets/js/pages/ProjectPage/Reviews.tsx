import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Icons from "@tabler/icons-react";
import * as Project from "@/graphql/Projects";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

import { useNavigate } from "react-router-dom";

export default function Reviews({ project }) {
  const navigate = useNavigate();
  const navigateToRequestReview = () => navigate(`/projects/${project.id}/reviews/request`);

  return (
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-white-1 leading-none">Project Reviews</div>
      <div className="text-white-2 max-w-xl">Assessments of the state of the project after each project phase.</div>

      <ReviewList project={project} />

      <div className="mb-2">
        <NextReviewSchedule project={project} />
      </div>

      <div>
        <Button variant="secondary" data-test-id="request-review-button" onClick={navigateToRequestReview}>
          Request impromptu review
        </Button>
      </div>
    </div>
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
  return <div className="text-white-2">No reviews have been submitted for this project.</div>;
}

function ReviewTable({ reviews, project }: { reviews: Updates.Update[]; project: Project.Project }) {
  return (
    <div className="flex flex-col gap-1 my-3">
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
        <div className="font-medium text-white-1 capitalize">
          {content.previousPhase} to {content.newPhase} Review
        </div>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <FormattedTime time={review.insertedAt} format="short-date" />
        <AckMarker update={review} />
      </div>
    </div>
  );
}

function AckMarker({ update }) {
  if (update.acknowledged) {
    return <Icons.IconCircleCheckFilled size={16} className="text-green-400" data-test-id="acknowledged-marker" />;
  } else {
    return <Icons.IconCircleCheckFilled size={16} className="text-white-3" />;
  }
}

function NextReviewSchedule({ project }) {
  if (project.phase === "completed") {
    return <div></div>;
  }

  const currentPhase = project.phaseHistory.find((phase) => phase.phase === project.phase);

  if (!currentPhase) {
    return <div></div>;
  }

  if (!currentPhase.dueTime) {
    return (
      <div className="flex gap-2 items-center max-w-lg text-white-2">
        The next review is scheduled for when the {currentPhase.phase} phase is completed. Currently, no due date is
        set.
      </div>
    );
  } else {
    return (
      <div className="flex gap-2 items-center max-w-lg text-white-2">
        The next review is scheduled for <FormattedTime time={currentPhase.dueTime} format="short-date" /> when the{" "}
        {currentPhase.phase} phase is scheduled to end.
      </div>
    );
  }
}
