defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteTest do
  use Operately.DataCase, async: true

  alias Operately.Goals.Goal
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{goal: goal}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert goal.id == Paths.goal_id(ctx.goal)
    refute Operately.Repo.get(Goal, ctx.goal.id)
  end

  test "returns invalid_arguments for a malformed goal id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
