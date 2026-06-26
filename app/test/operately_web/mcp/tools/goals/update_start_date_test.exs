defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateStartDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateStartDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal start date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "start_date" => "2026-07-15"
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_start_date.date == ~D[2026-07-15]
  end

  test "call/2 clears the goal start date when start_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "start_date" => "2026-07-15"
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_start_date.date == ~D[2026-07-15]

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_start_date == nil
  end
end
