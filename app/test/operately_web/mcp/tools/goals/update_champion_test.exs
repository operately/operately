defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateChampionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateChampion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal champion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "champion_id" => Paths.person_id(ctx.coworker)
             })

    assert ToolConnHelper.reload(ctx.goal).champion_id == ctx.coworker.id
  end

  test "call/2 clears the goal champion when champion_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, champion: :coworker)

    assert ctx.goal.champion_id == ctx.coworker.id

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert is_nil(ToolConnHelper.reload(ctx.goal).champion_id)
  end
end
