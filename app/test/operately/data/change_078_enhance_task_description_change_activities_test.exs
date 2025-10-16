defmodule Operately.Data.Change078EnhanceTaskDescriptionChangeActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change078EnhanceTaskDescriptionChangeActivities

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Test Project")
    |> Factory.add_project_milestone(:project_milestone, :project)
    |> Factory.add_project_task(:task, :project_milestone, name: "Test Task")
  end

  test "adds has_description as true when task exists and has meaningful TipTap description", ctx do
    # Update task to have a meaningful TipTap description
    {:ok, task_with_description} =
      Repo.update(
        Ecto.Changeset.change(ctx.task, %{
          description: %{
            "content" => [
              %{
                "type" => "paragraph",
                "content" => [%{"type" => "text", "text" => "This is a meaningful description"}]
              }
            ],
            "type" => "doc"
          }
        })
      )

    activity = create_test_activity(ctx.creator, ctx.project.id, task_with_description.id)

    assert activity.content["has_description"] == nil

    Change078EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["has_description"] == true
  end

  test "adds has_description as false when task exists but has no description", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, ctx.task.id)

    assert activity.content["has_description"] == nil

    Change078EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["has_description"] == false
  end

  test "adds has_description as false when task exists but has empty map description", ctx do
    # Update task to have an empty map description
    {:ok, task_with_empty_description} = Repo.update(Ecto.Changeset.change(ctx.task, %{description: %{}}))

    activity = create_test_activity(ctx.creator, ctx.project.id, task_with_empty_description.id)

    assert activity.content["has_description"] == nil

    Change078EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["has_description"] == false
  end

  test "sets has_description to false when task doesn't exist", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, Ecto.UUID.generate())

    assert activity.content["has_description"] == nil

    Change078EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["has_description"] == false
  end

  test "handles case where task_id is nil", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, nil)

    assert activity.content["has_description"] == nil

    Change078EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["has_description"] == false
  end

  defp create_test_activity(person, project_id, task_id) do
    attrs = %{
      action: "task_description_change",
      author_id: person.id,
      content: %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "project_id" => project_id,
        "task_id" => task_id,
        "task_name" => "Test Task",
        "project_name" => "Test Project"
      }
    }

    {:ok, activity} = Repo.insert(struct(Activity, attrs))

    activity
  end
end
