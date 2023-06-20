defmodule MyAppWeb.GraphQL.Mutations.ProjectsTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures

  @set_milestone_deadline_query """
  mutation setMilestoneDeadline($milestoneId: ID!, $deadlineAt: Date) {
    setMilestoneDeadline(milestoneId: $milestoneId, deadlineAt: $deadlineAt) {
      id
      deadlineAt
    }
  }
  """

  test "mutation: setMilestoneDeadline", %{conn: conn} do
    milestone = milestone_fixture(%{title: "Website Launched"})

    conn = graphql(conn, @set_milestone_deadline_query, %{
      "milestoneId" => milestone.id,
      "deadlineAt" => "2018-01-01"
    })

    assert json_response(conn, 200)
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
