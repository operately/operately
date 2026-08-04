defmodule Operately.ProjectTemplates.TaskTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.Task

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)

    {:ok, ctx}
  end

  test "stores a task directly under a template", ctx do
    changeset =
      Task.changeset(%{
        project_template_id: ctx.template.id,
        name: "Prepare launch",
        description: %{"type" => "doc", "content" => []},
        priority: "high",
        size: "medium",
        due_offset_days: 0,
        reminders: [%{type: :before_due, days: 2}]
      })

    assert changeset.valid?

    task = Repo.insert!(changeset)

    assert task.project_template_milestone_id == nil
    assert task.due_offset_days == 0
    assert task.task_status.value == "pending"
    assert [%{type: :before_due, days: 2}] = task.reminders
    assert Repo.get(Operately.Tasks.Task, task.id) == nil
    assert Operately.Tasks.Task.get(:system, id: task.id) == {:error, :not_found}
  end

  test "stores a task under a template milestone", ctx do
    ctx = Factory.add_project_template_task(ctx, :task, :template, milestone: :milestone)

    assert ctx.task.project_template_id == ctx.template.id
    assert ctx.task.project_template_milestone_id == ctx.milestone.id
  end

  test "requires template ownership, name, and description" do
    changeset = Task.changeset(%{})

    assert errors_on(changeset) == %{
             description: ["can't be blank"],
             name: ["can't be blank"],
             project_template_id: ["can't be blank"]
           }
  end

  test "accepts an unscheduled due date and rejects negative offsets", ctx do
    valid_attrs = %{project_template_id: ctx.template.id, name: "Task", description: %{}}

    assert Task.changeset(valid_attrs).valid?

    changeset = Task.changeset(Map.put(valid_attrs, :due_offset_days, -1))
    assert errors_on(changeset) == %{due_offset_days: ["must be greater than or equal to 0"]}
  end

  test "rejects fixed-date reminders", ctx do
    changeset =
      Task.changeset(%{
        project_template_id: ctx.template.id,
        name: "Task",
        description: %{},
        reminders: [%{type: :on_date, date: ~D[2026-08-10]}]
      })

    assert errors_on(changeset) == %{reminders: ["must be relative to the task due date"]}
  end

  test "enforces the due offset constraint in the database", ctx do
    task = Factory.add_project_template_task(ctx, :task, :template).task

    assert_raise Ecto.ConstraintError, ~r/project_template_tasks_due_offset_days_non_negative/, fn ->
      task
      |> change(due_offset_days: -1)
      |> Repo.update!()
    end
  end
end
