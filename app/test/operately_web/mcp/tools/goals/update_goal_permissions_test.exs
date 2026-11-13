defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateGoalPermissionsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateGoalPermissions, as: Tool
  alias OperatelyWeb.Paths

  test "updates company and space access and rejects foreign resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    conn = ToolConnHelper.conn(ctx)

    arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "access_levels" => %{"company" => "comment_access", "space" => "edit_access"}}
    assert {:ok, _} = Tool.call(conn, arguments)
    assert {:ok, %{goal: goal}} = OperatelyWeb.Api.Goals.Get.call(conn, %{id: ctx.goal.id, include_markdown: false, include_access_levels: true})
    assert goal.access_levels.company == Operately.Access.Binding.comment_access()
    assert goal.access_levels.space == Operately.Access.Binding.edit_access()

    other = Factory.setup(%{})
    assert {:error, :not_found, _} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(arguments, "goal_id", "definitely-not-a-valid-operately-id-%%%"))
  end

  test "rejects public access changes" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)

    for public <- ["no_access", "view_access"] do
      arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "access_levels" => %{"public" => public, "company" => "comment_access", "space" => "edit_access"}}
      assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn(ctx), arguments)
    end
  end

  test "advertises only company and space access" do
    schema = Tool.definition().input_schema["properties"]["access_levels"]
    assert Enum.sort(Map.keys(schema["properties"])) == ["company", "space"]
    assert Enum.sort(schema["required"]) == ["company", "space"]
    assert schema["additionalProperties"] == false
  end
end
