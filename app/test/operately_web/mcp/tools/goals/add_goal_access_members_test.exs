defmodule OperatelyWeb.Mcp.Tools.Goals.AddGoalAccessMembersTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.AddGoalAccessMembers, as: Tool
  alias OperatelyWeb.Paths

  test "adapts resource and member inputs and rejects foreign resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    conn = ToolConnHelper.conn(ctx)

    arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "members" => [%{"id" => Paths.person_id(ctx.member), "access_level" => "comment_access"}]}
    assert {:ok, _} = Tool.call(conn, arguments)

    other = Factory.setup(%{})
    assert {:error, :not_found, _} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(arguments, "goal_id", "definitely-not-a-valid-operately-id-%%%"))
  end
end
