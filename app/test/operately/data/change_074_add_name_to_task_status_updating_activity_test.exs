defmodule Operately.Data.Change074AddNameToTaskStatusUpdatingActivityTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change074AddNameToTaskStatusUpdatingActivity

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone, name: "Test Task Name")
  end

  test "adds task name to existing tasks in task_status_updating activities", ctx do
    activity = create_test_activity_with_task(ctx.creator, ctx.task.id)

    assert activity.content["name"] == nil

    Change074AddNameToTaskStatusUpdatingActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)
    assert updated_activity.content["name"] == "Test Task Name"
  end

  test "handles deleted tasks by setting empty string as name", ctx do
    non_existent_task_id = Ecto.UUID.generate()
    activity = create_test_activity_with_task(ctx.creator, non_existent_task_id)

    assert activity.content["name"] == nil

    Change074AddNameToTaskStatusUpdatingActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)
    assert updated_activity.content["name"] == ""
  end

  defp create_test_activity_with_task(person, task_id) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "task_status_updating",
        author_id: person.id,
        content: %{
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "project_id" => Ecto.UUID.generate(),
          "task_id" => task_id,
          "old_status" => "not_started",
          "new_status" => "in_progress"
        }
      })

    activity
  end
end
