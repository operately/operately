import { gql, useQuery } from "@apollo/client";

export function useFeed(projectId: string) {
  const query = gql`
    query ListActivities($scopeType: String!, $scopeId: String!) {
      activities(scopeType: $scopeType, scopeId: $scopeId) {
        id
        insertedAt

        author {
          ...PersonCoreFields
        }

        content {
          __typename

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
  `;

  const { data, loading, error } = useQuery(query, {
    fetchPolicy: "network-only",
    variables: {
      scopeType: "project",
      scopeId: projectId,
    },
  });

  if (loading) return { activities: [], loading: true, error: null };

  if (error) {
    console.error(error);
    return { activities: [], loading: false, error };
  }

  return { activities: data.activities, loading: false, error: null };
}
