defmodule Operately.Data.Change076EnhanceProjectGoalConnectionActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change076EnhanceProjectGoalConnectionActivities

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Test Project")
    |> Factory.add_goal(:goal, :space, name: "Test Goal")
  end

  test "adds goal_name to project_goal_connection activities when goal exists", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, ctx.goal.id)

    assert activity.content["goal_name"] == nil

    Change076EnhanceProjectGoalConnectionActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["goal_name"] == "Test Goal"
  end

  test "sets goal_name to nil for project_goal_connection activities when goal doesn't exist", ctx do
    # Create activity with non-existent goal_id
    activity = create_test_activity(ctx.creator, ctx.project.id, Ecto.UUID.generate())

    assert activity.content["goal_name"] == nil

    Change076EnhanceProjectGoalConnectionActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["goal_name"] == nil
  end

  test "handles case where goal_id is nil", ctx do
    activity = create_test_activity(ctx.creator, ctx.project.id, nil)

    assert activity.content["goal_name"] == nil

    Change076EnhanceProjectGoalConnectionActivities.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["goal_name"] == nil
  end

  defp create_test_activity(person, project_id, goal_id) do
    attrs = %{
      action: "project_goal_connection",
      author_id: person.id,
      content: %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "project_id" => project_id,
        "goal_id" => goal_id
      }
    }

    {:ok, activity} = Repo.insert(struct(Activity, attrs))

    activity
  end
end
