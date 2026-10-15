defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateCheckTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a checklist item" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_check(:check, :goal, name: "Launch the rewrite")

    assert {:ok, %{success: true}} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check),
               "name" => "Ship the onboarding rewrite"
             })

    assert ToolConnHelper.reload(ctx.check).name == "Ship the onboarding rewrite"
  end

  test "returns invalid_arguments for a malformed check id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "Ship the onboarding rewrite"
             })
  end
end
