defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteTargetTest do
  use Operately.DataCase, async: true

  alias Operately.Goals.Target
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.DeleteTarget
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a goal target" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal)

    assert {:ok, %{success: true}} =
             DeleteTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => Paths.target_id(ctx.target)
             })

    refute Repo.get(Target, ctx.target.id)
  end

  test "returns invalid_arguments for a malformed target id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             DeleteTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
