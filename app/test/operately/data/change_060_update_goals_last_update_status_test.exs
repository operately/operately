defmodule Operately.Data.Change060UpdateGoalsLastUpdateStatusTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.GoalsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "updates statuses according to mapping", ctx do
    goals =
      create_goals_with_statuses(ctx, [
        # should remain on_track
        "on_track",
        # should remain caution
        "caution",
        # should become caution
        "concern",
        # should become off_track
        "issue",
        # should become on_track
        "pending"
      ])

    Operately.Data.Change060UpdateGoalsLastUpdateStatus.run()

    updated_goals = reload_goals(goals)

    assert_statuses(updated_goals, [
      :on_track,
      :caution,
      :caution,
      :off_track,
      :on_track
    ])
  end

  test "raises error when unexpected statuses exist", ctx do
    _goals = create_goals_with_statuses(ctx, ["on_track", "caution", "invalid_status"])

    assert_raise RuntimeError, ~r/Found unexpected goal last_update_status values: invalid_status/, fn ->
      Operately.Data.Change060UpdateGoalsLastUpdateStatus.run()
    end
  end

  #
  # Helpers
  #

  defp create_goals_with_statuses(ctx, statuses) do
    goals =
      Enum.map(statuses, fn status ->
        insert_goal_with_status(ctx, status)
      end)

    goals
  end

  defp assert_statuses(goals, expected_statuses) do
    actual_statuses = Enum.map(goals, & &1.last_update_status)
    assert actual_statuses == expected_statuses
  end

  defp reload_goals(goals) do
    Enum.map(goals, &Repo.reload/1)
  end

  defp insert_goal_with_status(ctx, status) do
    goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})

    # Update its last_update_status directly via SQL to bypass validations
    goal_id = Ecto.UUID.dump!(goal.id)

    update_sql = """
    UPDATE goals
    SET last_update_status = $1
    WHERE id = $2
    """

    Repo.query!(update_sql, [status, goal_id])
    %{goal | last_update_status: String.to_atom(status)}
  end
end
