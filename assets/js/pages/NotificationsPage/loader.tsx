import * as Paper from "@/components/PaperContainer";

import client from "@/graphql/client";
import { gql, useSubscription } from "@apollo/client";
import { Notification } from "@/gql";

const query = gql`
  query ListNotifications($page: Int, $perPage: Int) {
    notifications(page: $page, perPage: $perPage) {
      id
      read
      activity {
        id
        insertedAt

        author {
          id
          fullName
          avatarUrl
        }

        content {
          __typename

          ... on ActivityContentGoalEditing {
            goalId
            oldName
            newName
            oldTimeframe
            newTimeframe
            oldChampionId
            newChampionId
            oldReviewerId
            newReviewerId
            addedTargets {
              id
            }
            updatedTargets {
              id
            }
            deletedTargets {
              id
            }
          }

          ... on ActivityContentProjectContributorAddition {
            project {
              id
              name
            }
          }

          ... on ActivityContentProjectGoalConnection {
            goal {
              id
              name
            }

            project {
              id
              name
            }
          }

          ... on ActivityContentProjectGoalDisconnection {
            goal {
              id
              name
            }

            project {
              id
              name
            }
          }

          ... on ActivityContentGoalCreated {
            goal {
              id
              name
              myRole
            }
          }

          ... on ActivityContentGoalArchived {
            goal {
              id
              name
            }
          }

          ... on ActivityContentProjectClosed {
            project {
              id
              name
            }
          }

          ... on ActivityContentProjectMoved {
            project {
              id
              name
            }

            oldSpace {
              id
              name
            }

            newSpace {
              id
              name
            }
          }

          ... on ActivityContentProjectTimelineEdited {
            project {
              id
              name
            }
          }

          ... on ActivityContentProjectDiscussionSubmitted {
            title
            discussionId
            projectId

            project {
              name
            }
          }

          ... on ActivityContentProjectDiscussionCommentSubmitted {
            projectId
            discussionId
            discussionTitle

            project {
              name
            }
          }

          ... on ActivityContentProjectStatusUpdateSubmitted {
            projectId
            statusUpdateId

            project {
              name
            }
          }

          ... on ActivityContentGoalCheckIn {
            goal {
              id
              name
            }

            update {
              id
            }
          }

          ... on ActivityContentGoalCheckInAcknowledgement {
            goal {
              id
              name
            }

            update {
              id
            }
          }

          ... on ActivityContentProjectStatusUpdateAcknowledged {
            projectId
            statusUpdateId

            project {
              name
            }
          }

          ... on ActivityContentProjectStatusUpdateCommented {
            projectId
            statusUpdateId

            project {
              name
            }
          }

          ... on ActivityContentProjectCreated {
            project {
              id
              name
              myRole
            }
          }

          ... on ActivityContentProjectArchived {
            project {
              id
              name
            }
          }

          ... on ActivityContentProjectReviewSubmitted {
            reviewId

            project {
              id
              name
            }
          }

          ... on ActivityContentProjectReviewRequestSubmitted {
            requestId

            project {
              id
              name
            }
          }

          ... on ActivityContentProjectReviewAcknowledged {
            projectId
            reviewId

            project {
              name
            }
          }

          ... on ActivityContentProjectReviewCommented {
            projectId
            reviewId

            project {
              name
            }
          }

          ... on ActivityContentProjectMilestoneCommented {
            commentAction

            milestone {
              id
              title
            }

            project {
              id
              name
            }
          }
        }
      }
    }
  }
`;

interface LoaderResult {
  notifications: Notification[];
}

export async function loader(): Promise<LoaderResult> {
  const data = await client.query({
    query,
    fetchPolicy: "network-only",
    variables: {
      page: 1,
      perPage: 100,
    },
  });

  return {
    notifications: data.data.notifications as Notification[],
  };
}

export function useLoadedData(): LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}

export function useRefresh() {
  const [_, refresh] = Paper.useLoadedData() as [LoaderResult, () => void];

  return refresh;
}

export function useSubscribeToChanges() {
  const refresh = useRefresh();

  const subscription = gql`
    subscription NotificationsChanged {
      onUnreadNotificationCountChanged
    }
  `;

  useSubscription(subscription, { onData: refresh });
}
