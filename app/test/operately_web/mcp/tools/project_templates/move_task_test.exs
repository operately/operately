defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveTaskTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Task
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveTask
  alias OperatelyWeb.Paths

  test "call/2 moves a task to another milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)
      |> Factory.add_project_template_milestone(:target_milestone, :template, due_offset_days: 20)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone, due_offset_days: 5)

    assert {:ok, %{task: task}} =
             MoveTask.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "task_id" => Paths.project_template_task_id(ctx.task),
               "milestone_id" => Paths.project_template_milestone_id(ctx.target_milestone),
               "index" => 0
             })

    db_task = Operately.Repo.get!(Task, ctx.task.id)

    assert task.project_template_milestone_id == Paths.project_template_milestone_id(ctx.target_milestone)
    assert db_task.project_template_milestone_id == ctx.target_milestone.id
  end
end
