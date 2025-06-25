defmodule Operately.Data.Change062SetGoalSuccessStatusTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.GoalsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> setup_test_goals()
  end

  test "sets success_status for closed goals", ctx do
    Operately.Data.Change062SetGoalSuccessStatus.run()

    achieved_goal = Repo.get(Operately.Goals.Goal, ctx.achieved_goal.id)
    missed_goal = Repo.get(Operately.Goals.Goal, ctx.missed_goal.id)
    open_goal = Repo.get(Operately.Goals.Goal, ctx.open_goal.id)
    success_only_goal = Repo.get(Operately.Goals.Goal, ctx.success_only_goal.id)

    assert achieved_goal.success_status == :achieved
    assert missed_goal.success_status == :missed
    assert open_goal.success_status == nil
    assert success_only_goal.success_status == :achieved
  end

  defp setup_test_goals(ctx) do
    achieved_goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})
    set_goal_attributes(achieved_goal.id, closed_at: ~U[2025-06-01 10:00:00Z], success: "yes")

    missed_goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})
    set_goal_attributes(missed_goal.id, closed_at: ~U[2025-06-01 10:00:00Z], success: "no")

    success_only_goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})
    set_goal_attributes(success_only_goal.id, success: "yes")

    open_goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})

    ctx
    |> Map.put(:achieved_goal, achieved_goal)
    |> Map.put(:missed_goal, missed_goal)
    |> Map.put(:open_goal, open_goal)
    |> Map.put(:success_only_goal, success_only_goal)
  end

  defp set_goal_attributes(goal_id, attrs) do
    goal_id = Ecto.UUID.dump!(goal_id)

    Enum.each(attrs, fn {field, value} ->
      update_sql = "UPDATE goals SET #{field} = $1 WHERE id = $2"
      Repo.query!(update_sql, [value, goal_id])
    end)
  end
end
