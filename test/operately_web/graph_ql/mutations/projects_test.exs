defmodule MyAppWeb.GraphQL.Mutations.ProjectsTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures

  @update_project_milestone """
  mutation updateProjectMilestone($milestoneId: ID!, $title: String!, $deadlineAt: Date) {
    updateProjectMilestone(milestoneId: $milestoneId, title: $title, deadlineAt: $deadlineAt) {
      id
      deadlineAt
    }
  }
  """

  test "mutation: update_project_milestone", %{conn: conn} do
    milestone = milestone_fixture(%{title: "Website Launched"})

    conn = graphql(conn, @update_project_milestone, %{
      "milestoneId" => milestone.id,
      "title" => "Website Launched for all customers",
      "deadlineAt" => "2018-01-01"
    })

    assert json_response(conn, 200)
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
