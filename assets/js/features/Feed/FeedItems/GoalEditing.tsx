import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { FeedItem, Container } from "../FeedItem";

export const GoalEditing: FeedItem = {
  typename: "ActivityContentGoalEditing",
  contentQuery: `
    newName
    oldName
    newTimeframe
    oldTimeframe
    newChampionId
    oldChampionId
    newChampion {
      fullName
    }
    newReviewerId
    oldReviewerId
    newReviewer {
      fullName
    }
    addedTargets {
      id
      name
    }
    updatedTargets {
      id
      oldName
      newName
    }
    deletedTargets {
      id
      name
    }
    goal {
      id 
      name
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={
          <>
            {People.shortName(activity.author)} edited the{" "}
            {page === "goal" ? (
              "goal"
            ) : (
              <>
                <Link to={Paths.goalPath(content.goal.id)}>{content.goal.name}</Link> goal
              </>
            )}
          </>
        }
        author={activity.author}
        time={activity.insertedAt}
        content={<Content activity={activity} />}
      />
    );
  },
};

function Content({ activity }) {
  const content = activity.content;

  return (
    <div className="flex-flex-col gap-1">
      <NewName content={content} />
      <Timeframe content={content} />
      <Champion content={content} />
      <Reviewer content={content} />
      <AddedTargets content={content} />
      <UpdatedTargets content={content} />
      <DeletedTargets content={content} />
    </div>
  );
}

function NewName({ content }) {
  if (content.newName === content.oldName) return null;

  return <div>The name was changed to {content.newName}.</div>;
}

function Timeframe({ content }) {
  if (content.oldTimeframe === content.newTimeframe) return null;

  return <div>The timeframe was changed to {content.newTimeframe}.</div>;
}

function Champion({ content }) {
  if (content.oldChampionId === content.newChampionId) return null;

  return <div>The champion was changed to {content.newChampion.fullName}.</div>;
}

function Reviewer({ content }) {
  if (content.oldReviewerId === content.newReviewerId) return null;

  return <div>The reviewer was changed to {content.newReviewer.fullName}.</div>;
}

function AddedTargets({ content }) {
  if (!content.addedTargets) return null;
  if (content.addedTargets.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were added:
      <ul>
        {content.addedTargets.map((target) => (
          <li key={target.id}>- {target.name}</li>
        ))}
      </ul>
    </div>
  );
}

function UpdatedTargets({ content }) {
  const updated = content.updatedTargets.filter((t) => t.oldName !== t.newName);

  if (updated.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were updated:
      <ul>
        {updated.map((target) => (
          <li key={target.id}>- {target.newName}</li>
        ))}
      </ul>
    </div>
  );
}

function DeletedTargets({ content }) {
  if (!content.deletedTargets) return null;
  if (content.deletedTargets.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were removed:
      <ul>
        {content.deletedTargets.map((target) => (
          <li key={target.id}>- {target.name}</li>
        ))}
      </ul>
    </div>
  );
}
