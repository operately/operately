import { gql, useQuery } from "@apollo/client";

export function useFeed(scopeId: string, scopeType: string) {
  const { data, loading, error } = useQuery(query, {
    fetchPolicy: "network-only",
    variables: {
      scopeType: scopeType,
      scopeId: scopeId,
    },
  });

  if (loading) return { activities: [], loading: true, error: null };

  if (error) {
    console.error(error);
    return { activities: [], loading: false, error };
  }

  return { activities: data.activities, loading: false, error: null };
}

const query = gql`
  query ListActivities($scopeType: String!, $scopeId: String!) {
    activities(scopeType: $scopeType, scopeId: $scopeId) {
      id
      insertedAt

      author {
        id
        fullName
        avatarUrl
      }

      content {
        __typename

        ... on ActivityContentProjectContributorAddition {
          person {
            id
            fullName
            avatarUrl
            title
          }
        }

        ... on ActivityContentProjectClosed {
          project {
            id
            name
          }
        }

        ... on ActivityContentProjectGoalConnection {
          project {
            id
            name
          }

          goal {
            id
            name
          }
        }

        ... on ActivityContentProjectGoalDisconnection {
          project {
            id
            name
          }

          goal {
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

        ... on ActivityContentGoalEditing {
          oldName
          newName
          oldTimeframe
          newTimeframe
          oldChampionId
          newChampionId
          newChampion {
            id
            fullName
            avatarUrl
            title
          }
          oldReviewerId
          newReviewerId
          newReviewer {
            id
            fullName
            avatarUrl
            title
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
        }

        ... on ActivityContentGoalArchived {
          goal {
            id
            name
            myRole
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

        ... on ActivityContentProjectRenamed {
          project {
            id
            name
          }

          oldName
          newName
        }

        ... on ActivityContentProjectTimelineEdited {
          project {
            id
            name
          }

          oldStartDate
          oldEndDate
          newStartDate
          newEndDate

          newMilestones {
            id
            title
            deadlineAt
          }

          updatedMilestones {
            id
            title
            deadlineAt
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

        ... on ActivityContentDiscussionCommentSubmitted {
          spaceId
          discussionId
          title

          space {
            id
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
            insertedAt
            message
          }
        }

        ... on ActivityContentProjectStatusUpdateSubmitted {
          project {
            id
            name
          }

          update {
            id
            insertedAt
            message

            content {
              __typename

              ... on UpdateContentStatusUpdate {
                health {
                  status
                }
              }
            }
          }
        }

        ... on ActivityContentProjectStatusUpdateAcknowledged {
          projectId

          update {
            id
            insertedAt
            message
          }
        }

        ... on ActivityContentGoalCheckInAcknowledgement {
          goal {
            id
            name
          }

          update {
            id
            insertedAt
            message
          }
        }

        ... on ActivityContentProjectStatusUpdateCommented {
          projectId

          project {
            id
            name
          }

          update {
            id
            insertedAt
            message
          }

          comment {
            message
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
          projectId
          commentAction

          milestone {
            id
            title
          }

          comment {
            message
          }
        }
      }
    }
  }
`;
