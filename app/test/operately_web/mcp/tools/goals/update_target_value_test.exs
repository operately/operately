defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateTargetValueTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateTargetValue
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates the current target value" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal, name: "Revenue", from: 10, to: 100, value: 10, unit: "USD", index: 1)

    assert {:ok, %{success: true}} =
             UpdateTargetValue.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => Paths.target_id(ctx.target),
               "value" => 42.5
             })

    assert ToolConnHelper.reload(ctx.target).value == 42.5
  end
end
