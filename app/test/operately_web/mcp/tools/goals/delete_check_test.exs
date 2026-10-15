defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteCheckTest do
  use Operately.DataCase, async: true

  alias Operately.Goals.Check
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.DeleteCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a checklist item" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_check(:check, :goal)

    assert {:ok, %{success: true}} =
             DeleteCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check)
             })

    refute Repo.get(Check, ctx.check.id)
  end

  test "returns invalid_arguments for a malformed check id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             DeleteCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
