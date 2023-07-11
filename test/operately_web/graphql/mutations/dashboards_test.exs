defmodule OperatelyWeb.GraphQL.Mutations.DashboardsTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  @update_dashboard """
  mutation UpdateDashboard($input: UpdateDashboardInput!) {
    updateDashboard(input: $input) {
      id
      panels {
        id
        index
        type
      }
    }
  }
  """

  test "mutation: update dashboard", ctx do
    {:ok, dashboard} = Operately.People.find_or_create_home_dashboard(ctx.person)
    panels = Operately.Repo.preload(dashboard, [:panels]).panels

    updated_panels = Enum.map(panels, fn panel ->
      %{
        id: panel.id, 
        index: rem(panel.index + 1, Enum.count(panels)),
        type: panel.type
      }
    end)

    conn = graphql(ctx.conn, @update_dashboard, %{
      input: %{id: dashboard.id, panels: updated_panels}
    })

    assert json_response(conn, 200) == %{
      "data" => %{
      }
    }
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
