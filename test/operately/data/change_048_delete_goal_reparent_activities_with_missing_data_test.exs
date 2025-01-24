defmodule Operately.Data.Change048DeleteGoalReparentActivitiesWithMissingDataTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:parent_goal, :space)
    |> Factory.add_goal(:new_parent_goal, :space)
    |> Factory.add_goal(:goal, :space, parent_goal: :parent_goal)
    |> create_activities()
  end

  test "Adds space_id and goal_id to activity content", ctx do
    assert_activities_exist(ctx.complete_activities)
    assert_activities_exist(ctx.incomplete_activities)

    Operately.Data.Change048DeleteGoalReparentActivitiesWithMissingData.run()

    assert_activities_exist(ctx.complete_activities)
    refute_activities_exist(ctx.incomplete_activities)
  end

  #
  # Steps
  #

  defp assert_activities_exist(activities) do
    Enum.each(activities, fn a ->
      assert Operately.Activities.get_activity(a.id)
    end)
  end

  defp refute_activities_exist(activities) do
    Enum.each(activities, fn a ->
      refute Operately.Activities.get_activity(a.id)
    end)
  end

  #
  # Helpers
  #

  defp create_activities(ctx) do
    content =  %{
      "company_id" => ctx.company.id,
      "old_parent_goal_id" => ctx.parent_goal.id,
      "new_parent_goal_id" => ctx.new_parent_goal.id,
    }

    incomplete_activities = Enum.map(1..3, fn _ ->
      activity_fixture(author_id: ctx.creator.id, action: "goal_reparent", content: content)
    end)

    complete_activities = Enum.map(1..3, fn _ ->
      activity_fixture(author_id: ctx.creator.id, action: "goal_reparent", content: Map.merge(content, %{
        "space_id" => ctx.space.id,
        "goal_id" => ctx.goal.id,
      }))
    end)

    ctx
    |> Map.put(:incomplete_activities, incomplete_activities)
    |> Map.put(:complete_activities, complete_activities)
  end
end
