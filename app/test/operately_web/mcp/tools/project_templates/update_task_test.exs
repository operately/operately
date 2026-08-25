defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTaskTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Task
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTask
  alias OperatelyWeb.Paths

  test "call/2 updates a template task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone, due_offset_days: 5)

    template = Operately.Repo.reload!(ctx.template)

    assert {:ok, %{task: task}} =
             UpdateTask.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "task_id" => Paths.project_template_task_id(ctx.task),
               "name" => "Updated task",
               "description" => "",
               "reminders" => [%{"type" => "due_day"}],
               "task_status" => %{"id" => hd(template.task_statuses).id}
             })

    db_task = Operately.Repo.get!(Task, ctx.task.id)

    assert task.name == "Updated task"
    assert db_task.name == "Updated task"
    assert hd(db_task.reminders).type == :due_day
  end
end
