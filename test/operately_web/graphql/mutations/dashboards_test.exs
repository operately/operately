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

    new_panels = [%{
      id: nil,
      index: 10,
      type: "account"
    }]

    conn = graphql(ctx.conn, @update_dashboard, %{
      input: %{id: dashboard.id, panels: updated_panels ++ new_panels}
    })

    panels = Operately.Repo.preload(dashboard, [:panels]).panels

    assert json_response(conn, 200) == %{
      "data" => %{
        "updateDashboard" => %{
          "id" => dashboard.id,
          "panels" => (
            updated_panels
            |> Enum.sort_by(fn p -> p.index end) 
            |> Enum.map(fn panel ->
              %{
                "id" => panel.id,
                "index" => panel.index,
                "type" => panel.type
              }
            end)
          ) ++ [%{
            "id" => Enum.find(panels, fn panel -> panel.index == 10 end).id,
            "index" => 10,
            "type" => "account"
          }]
        }
      }
    }
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
