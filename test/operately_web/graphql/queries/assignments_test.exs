defmodule MyAppWeb.GraphQL.Queries.AssignmentTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  setup ctx do
    group = group_fixture(ctx.person, %{company_id: ctx.company.id})

    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.person.id,
      group_id: group.id,
    })

    {:ok, project} = Operately.Projects.update_project(project, %{
      next_update_scheduled_at: DateTime.utc_now() |> DateTime.add(-2, :day)
    })

    contributor_fixture(%{
      project_id: project.id,
      person_id: ctx.person.id,
      role: :champion
    })

    milestone = milestone_fixture(ctx.person, %{
      project_id: project.id,
      deadline_at: DateTime.utc_now(),
      status: :pending
    })

    {:ok, %{project: project, milestone: milestone}}
  end

  @get_assignments_query """
    query getAssignments($rangeStart: DateTime!, $rangeEnd: DateTime!) {
      assignments(rangeStart: $rangeStart, rangeEnd: $rangeEnd) {
        assignments {
          type
          due

          resource {
            ... on Milestone {
              title
            }

            ... on Project {
              name
            }
          }
        }
      }
    }
  """

  test "query: getAssignments", ctx do
    one_week_ago = DateTime.utc_now() |> DateTime.add(-7, :day) |> DateTime.to_iso8601()
    one_week_from_now = DateTime.utc_now() |> DateTime.add(7, :day) |> DateTime.to_iso8601()

    conn = graphql(ctx.conn, @get_assignments_query, %{
      "rangeStart" => one_week_ago,
      "rangeEnd" => one_week_from_now
    })

    assert json_response(conn, 200) == %{
      "data" => %{
        "assignments" => %{
          "assignments" => [
            %{
              "due" => Date.to_iso8601(ctx.milestone.deadline_at),
              "resource" => %{
                "title" => ctx.milestone.title
              },
              "type" => "milestone"
            },
            %{
              "due" => Date.to_iso8601(ctx.project.next_update_scheduled_at),
              "resource" => %{"name" => "some name"}, 
              "type" => "project_status_update"
            }
          ]
        }
      }
    }
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
