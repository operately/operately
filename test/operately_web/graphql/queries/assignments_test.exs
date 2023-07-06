defmodule MyAppWeb.GraphQL.Queries.AssignmentTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures

  setup ctx do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.person.id
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
        project_status_updates {
          name
        }
        milestones {
          id
        }
      }
    }
  """

  test "query: getAssignments", ctx do
    one_week_ago = DateTime.utc_now() |> DateTime.add(-30, :day) |> DateTime.to_iso8601()
    one_week_from_now = DateTime.utc_now() |> DateTime.add(30, :day) |> DateTime.to_iso8601()

    conn = graphql(ctx.conn, @get_assignments_query, %{
      "rangeStart" => one_week_ago,
      "rangeEnd" => one_week_from_now
    })

    assert json_response(conn, 200) == %{
      "data" => %{
        "assignments" => %{
          "project_status_updates" => [
            %{
              "name" => ctx.project.name
            }
          ],
          "milestones" => [
            %{
              "id" => ctx.milestone.id,
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
