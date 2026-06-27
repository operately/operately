defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateDueDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.UpdateDueDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a milestone due date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{milestone: milestone}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "due_date" => "2026-09-01"
             })

    assert milestone.id == Paths.milestone_id(ctx.milestone)
    assert ToolConnHelper.reload(ctx.milestone).timeframe.contextual_end_date.date == ~D[2026-09-01]
  end

  test "call/2 clears the milestone due date when due_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{milestone: milestone}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "due_date" => "2026-09-01"
             })

    assert milestone.id == Paths.milestone_id(ctx.milestone)
    assert ToolConnHelper.reload(ctx.milestone).timeframe.contextual_end_date.date == ~D[2026-09-01]

    assert {:ok, %{milestone: milestone}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone)
             })

    assert milestone.id == Paths.milestone_id(ctx.milestone)

    reloaded = ToolConnHelper.reload(ctx.milestone)
    assert reloaded.timeframe == nil || reloaded.timeframe.contextual_end_date == nil
  end
end
