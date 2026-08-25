defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateTaskTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Task
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateTask
  alias OperatelyWeb.Paths

  test "call/2 creates a task on a template milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)
      |> Factory.add_company_member(:other)

    template = Operately.Repo.reload!(ctx.template)

    assert {:ok, %{task: task}} =
             CreateTask.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "milestone_id" => Paths.project_template_milestone_id(ctx.milestone),
               "name" => "New task",
               "description" => "Task details",
               "due_offset_days" => 8,
               "reminders" => [%{"type" => "before_due", "days" => 2}],
               "task_status" => %{"id" => hd(template.task_statuses).id},
               "assignee_ids" => [Paths.person_id(ctx.other)]
             })

    db_task =
      task.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Task, &1))

    assert db_task.name == "New task"
    assert db_task.project_template_milestone_id == ctx.milestone.id
    assert db_task.due_offset_days == 8
  end
end
