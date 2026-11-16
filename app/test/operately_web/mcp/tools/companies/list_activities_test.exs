defmodule OperatelyWeb.Mcp.Tools.Companies.ListActivitiesTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Companies.ListActivities, as: Tool
  alias OperatelyWeb.Paths

  test "lists the connected company's feed and filters encoded resource IDs" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    conn = ToolConnHelper.conn(ctx)
    args = %{"scope_type" => "project", "scope_id" => Paths.project_id(ctx.project), "actions" => ["project_created"]}

    assert {:ok, %{activities: [activity], next_cursor: nil}} = Tool.call(conn, args)
    assert activity.action == "project_created"
    assert {:ok, %{activities: company_activities}} = Tool.call(conn, %{})
    assert Enum.any?(company_activities, &(&1.id == activity.id))
    assert {:ok, %{activities: []}} = Tool.call(ToolConnHelper.conn(Factory.setup(%{})), args)

    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(args, "scope_id", "invalid-%%"))
    assert {:error, :invalid_arguments} = Tool.call(conn, %{"scope_type" => "company", "scope_id" => "anything"})
    assert {:error, :bad_request, _} = Tool.call(conn, %{"cursor" => "invalid"})
  end

  test "paginates rather than returning the entire feed" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    for _ <- 1..21, do: Factory.add_project(ctx, :project, :space)
    conn = ToolConnHelper.conn(ctx)
    args = %{"actions" => ["project_created"]}

    assert {:ok, %{activities: first, next_cursor: cursor}} = Tool.call(conn, args)

    assert length(first) == 20
    assert is_binary(cursor)
    assert {:ok, %{activities: [last], next_cursor: nil}} = Tool.call(conn, Map.put(args, "cursor", cursor))
    refute Enum.any?(first, &(&1.id == last.id))
  end
end
