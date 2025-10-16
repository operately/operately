defmodule Operately.Data.Change075EnhanceTaskDescriptionChangeActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change075EnhanceTaskDescriptionChangeActivities

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Test Project")
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone, name: "Test Task Name")
  end

  test "adds task_name, project_id, project_name and updates access_context to task_description_change activities", ctx do
    # Get project and space access contexts
    space_context = Repo.one(from c in Context, where: c.group_id == ^ctx.space.id)
    project_context = Repo.one(from c in Context, where: c.project_id == ^ctx.project.id)

    # Create activity with space context
    activity = create_test_activity_with_task(ctx.creator, ctx.task.id, space_context.id)

    assert activity.content["task_name"] == nil
    assert activity.content["project_id"] == nil
    assert activity.content["project_name"] == nil
    assert activity.access_context_id == space_context.id

    Change075EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["task_name"] == "Test Task Name"
    assert updated_activity.content["project_id"] == ctx.project.id
    assert updated_activity.content["project_name"] == "Test Project"
    assert updated_activity.access_context_id == project_context.id
  end

  test "handles tasks with direct project relationship (no milestone)", ctx do
    # Create a task with direct project relationship but no milestone
    direct_task =
      Operately.TasksFixtures.task_fixture(%{
        name: "Direct Project Task",
        description: %{},
        project_id: ctx.project.id,
        milestone_id: nil,
        creator_id: ctx.creator.id
      })

    # Get project and space access contexts
    space_context = Repo.one(from c in Context, where: c.group_id == ^ctx.space.id)
    project_context = Repo.one(from c in Context, where: c.project_id == ^ctx.project.id)

    # Create activity with space context
    activity = create_test_activity_with_task(ctx.creator, direct_task.id, space_context.id)

    Change075EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["task_name"] == "Direct Project Task"
    assert updated_activity.content["project_id"] == ctx.project.id
    assert updated_activity.content["project_name"] == "Test Project"
    assert updated_activity.access_context_id == project_context.id
  end

  test "handles deleted tasks by setting empty values and preserving access context", ctx do
    non_existent_task_id = Ecto.UUID.generate()

    # Get project and space access contexts
    space_context = Repo.one(from c in Context, where: c.group_id == ^ctx.space.id)
    activity = create_test_activity_with_task(ctx.creator, non_existent_task_id, space_context.id)

    assert activity.content["task_name"] == nil
    assert activity.content["project_id"] == nil
    assert activity.content["project_name"] == nil
    assert activity.access_context_id == space_context.id

    Change075EnhanceTaskDescriptionChangeActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)
    assert updated_activity.content["task_name"] == ""
    assert updated_activity.content["project_id"] == ""
    assert updated_activity.content["project_name"] == ""
    # Access context should remain unchanged for deleted tasks
    assert updated_activity.access_context_id == space_context.id
  end

  defp create_test_activity_with_task(person, task_id, access_context_id) do
    attrs = %{
      action: "task_description_change",
      author_id: person.id,
      content: %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "task_id" => task_id
      }
    }

    attrs = if access_context_id, do: Map.put(attrs, :access_context_id, access_context_id), else: attrs

    {:ok, activity} = Repo.insert(struct(Activity, attrs))

    activity
  end
end
