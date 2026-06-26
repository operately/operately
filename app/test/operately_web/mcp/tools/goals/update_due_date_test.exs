defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDueDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateDueDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal due date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "due_date" => "2026-10-01"
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_end_date.date == ~D[2026-10-01]
  end

  test "call/2 clears the goal due date when due_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "due_date" => "2026-10-01"
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_end_date.date == ~D[2026-10-01]

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert ToolConnHelper.reload(ctx.goal).timeframe.contextual_end_date == nil
  end
end
