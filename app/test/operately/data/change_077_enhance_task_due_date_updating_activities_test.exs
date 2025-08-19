defmodule Operately.Data.Change077EnhanceTaskDueDateUpdatingActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change077EnhanceTaskDueDateUpdatingActivities

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Test Project")
    |> Factory.add_project_milestone(:project_milestone, :project)
    |> Factory.add_project_task(:task, :project_milestone, name: "Test Task")
  end

  test "adds task_name to task_due_date_updating activities when task exists", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, ctx.task.id)

    assert activity.content["task_name"] == nil

    Change077EnhanceTaskDueDateUpdatingActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["task_name"] == "Test Task"
  end

  test "sets task_name to nil for task_due_date_updating activities when task doesn't exist", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, Ecto.UUID.generate())

    assert activity.content["task_name"] == nil

    Change077EnhanceTaskDueDateUpdatingActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["task_name"] == nil
  end

  test "handles case where task_id is nil", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, nil)

    assert activity.content["task_name"] == nil

    Change077EnhanceTaskDueDateUpdatingActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["task_name"] == nil
  end

  defp create_test_activity(person, project_id, task_id) do
    attrs = %{
      action: "task_due_date_updating",
      author_id: person.id,
      content: %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "project_id" => project_id,
        "task_id" => task_id,
        "old_due_date" => "2023-01-01",
        "new_due_date" => "2023-02-01"
      }
    }

    {:ok, activity} = Repo.insert(struct(Activity, attrs))

    activity
  end
end
