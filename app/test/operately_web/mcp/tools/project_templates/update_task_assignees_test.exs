defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTaskAssigneesTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.{Person, TaskAssignment}
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTaskAssignees
  alias OperatelyWeb.Paths

  test "call/2 replaces task assignees" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone, due_offset_days: 5)
      |> Factory.add_company_member(:other)

    assert {:ok, %{assignments: assignments}} =
             UpdateTaskAssignees.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "task_id" => Paths.project_template_task_id(ctx.task),
               "assignee_ids" => [Paths.person_id(ctx.other)]
             })

    template_person = Operately.Repo.get_by!(Person, project_template_id: ctx.template.id, person_id: ctx.other.id)

    assert length(assignments) == 1
    assert hd(assignments).contributor_id == Paths.project_template_person_id(template_person)
    assert hd(assignments).project_template_task_id == Paths.project_template_task_id(ctx.task)

    assert Operately.Repo.get_by(TaskAssignment,
             project_template_task_id: ctx.task.id,
             project_template_person_id: template_person.id
           )
  end
end
