import { FeedItem } from "../FeedItem";

import { ProjectCreated } from "./ProjectCreated";
import { ProjectCheckInSubmitted } from "./ProjectCheckInSubmitted";
import { ProjectCheckInAcknowledged } from "./ProjectCheckInAcknowledged";
import { ProjectArchived } from "./ProjectArchived";
import { ProjectMoved } from "./ProjectMoved";
import { ProjectContributorAddition } from "./ProjectContributorAddition";
import { ProjectRenamed } from "./ProjectRenamed";
import { ProjectClosed } from "./ProjectClosed";
import { ProjectGoalConnection } from "./ProjectGoalConnection";
import { ProjectGoalDisconnection } from "./ProjectGoalDisconnection";
import { GoalCreated } from "./GoalCreated";

const FeedItems: FeedItem[] = [
  ProjectCreated,
  ProjectCheckInSubmitted,
  ProjectCheckInAcknowledged,
  ProjectArchived,
  ProjectMoved,
  ProjectContributorAddition,
  ProjectRenamed,
  ProjectClosed,
  ProjectGoalConnection,
  ProjectGoalDisconnection,
  GoalCreated,
];

export default FeedItems;
