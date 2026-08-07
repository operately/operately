defmodule Operately.ProjectTemplates.TaskAssignmentTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.TaskAssignment
  alias Operately.Repo
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_project_template_task(:task, :template)
    |> Factory.add_company_member(:member)
    |> Factory.add_project_template_person(:template_person, :template, :member)
  end

  test "requires template, task, and person references" do
    refute TaskAssignment.changeset(%{}).valid?
  end

  test "deleting a task cascades its assignments", ctx do
    assignment =
      %{
        project_template_id: ctx.template.id,
        project_template_task_id: ctx.task.id,
        project_template_person_id: ctx.template_person.id
      }
      |> TaskAssignment.changeset()
      |> Repo.insert!()

    Repo.delete!(ctx.task)

    refute Repo.get(TaskAssignment, assignment.id)
  end
end
