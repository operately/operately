defmodule MyAppWeb.GraphQL.Queries.AssignmentTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures

  setup ctx do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.person.id
    })

    Operately.Repo.delete_all(Operately.Projects.Milestone)

    contributor_fixture(%{
      project_id: project.id,
      person_id: ctx.person.id,
      role: :champion
    })

    milestone = milestone_fixture(ctx.person, %{project_id: project.id})

    {:ok, %{project: project, milestone: milestone}}
  end

  @get_assignments_query """
    query getAssignments {
      assignments {
        project_status_udpates {
          id
          name
        }
        milestones {
          id
        }
      }
    }
  """

  test "query: getAssignments", ctx do
    conn = graphql(ctx.conn, @get_assignments_query, %{})

    assert json_response(conn, 200) == %{
      "data" => %{
        "assignments" => %{
          "project_status_udpates" => [
            %{
              "id" => ctx.project.id,
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
