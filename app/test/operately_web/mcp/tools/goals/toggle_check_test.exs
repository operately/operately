defmodule OperatelyWeb.Mcp.Tools.Goals.ToggleCheckTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.ToggleCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 toggles a checklist item" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_check(:check, :goal, name: "Launch the rewrite")

    refute ctx.check.completed

    assert {:ok, %{success: true}} =
             ToggleCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check)
             })

    assert ToolConnHelper.reload(ctx.check).completed
  end
end
