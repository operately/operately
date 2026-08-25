defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteTaskTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Task
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteTask
  alias OperatelyWeb.Paths

  test "call/2 deletes a template task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone, due_offset_days: 5)

    assert {:ok, %{success: true}} =
             DeleteTask.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "task_id" => Paths.project_template_task_id(ctx.task)
             })

    refute Operately.Repo.get(Task, ctx.task.id)
  end
end
