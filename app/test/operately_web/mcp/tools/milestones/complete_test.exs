defmodule OperatelyWeb.Mcp.Tools.Milestones.CompleteTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.Complete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 completes a milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{comment: comment}} =
             Complete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone)
             })

    assert get_in(comment, [:comment, :id])
    assert ToolConnHelper.reload(ctx.milestone).status == :done
  end

  test "call/2 moves open tasks out of the completed milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{comment: _comment}} =
             Complete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "open_tasks_resolution" => %{"action" => "move_to_no_milestone"}
             })

    assert ToolConnHelper.reload(ctx.milestone).status == :done
    assert ToolConnHelper.reload(ctx.task).milestone_id == nil
  end

  test "call/2 closes open tasks with the selected status" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    closed_status = Enum.find(ctx.project.task_statuses, &(&1.closed && &1.color == :green))

    assert {:ok, %{comment: _comment}} =
             Complete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "open_tasks_resolution" => %{
                 "action" => "set_status",
                 "status_id" => closed_status.id
               }
             })

    task = ToolConnHelper.reload(ctx.task)
    assert task.task_status.id == closed_status.id
    assert task.closed_at
  end
end
