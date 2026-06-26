defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateMilestoneTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateMilestone
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project task milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_milestone(:target_milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateMilestone.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "milestone_id" => Paths.milestone_id(ctx.target_milestone)
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task).milestone_id == ctx.target_milestone.id
  end

  test "call/2 clears the task milestone when milestone_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert ctx.task.milestone_id == ctx.milestone.id

    assert {:ok, %{task: task}} =
             UpdateMilestone.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert task.id == Paths.task_id(ctx.task)
    assert is_nil(ToolConnHelper.reload(ctx.task).milestone_id)
  end

  test "returns invalid_arguments for space tasks" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.create_space_task(:task, :space)

    assert {:error, :invalid_arguments} =
             UpdateMilestone.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })
  end
end
