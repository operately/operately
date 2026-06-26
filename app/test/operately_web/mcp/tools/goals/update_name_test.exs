defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateNameTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateName
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateName.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "name" => "Renamed MCP Goal"
             })

    assert ToolConnHelper.reload(ctx.goal).name == "Renamed MCP Goal"
  end
end
