defmodule Operately.Data.Change059UpdateGoalUpdateStatusTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.GoalsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  test "updates statuses according to mapping", ctx do
    updates =
      create_updates_with_statuses(ctx, [
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

    Operately.Data.Change059UpdateGoalUpdateStatus.run()

    updated_updates = reload_updates(updates)

    assert_statuses(updated_updates, [
      :on_track,
      :caution,
      :caution,
      :off_track,
      :on_track
    ])
  end

  test "raises error when unexpected statuses exist", ctx do
    _updates = create_updates_with_statuses(ctx, ["on_track", "caution", "invalid_status"])

    assert_raise RuntimeError, ~r/Found unexpected goal update statuses: invalid_status/, fn ->
      Operately.Data.Change059UpdateGoalUpdateStatus.run()
    end
  end

  #
  # Helpers
  #

  defp create_updates_with_statuses(ctx, statuses) do
    updates =
      Enum.map(statuses, fn status ->
        insert_update_with_status(ctx, status)
      end)

    updates
  end

  defp assert_statuses(updates, expected_statuses) do
    actual_statuses = Enum.map(updates, & &1.status)
    assert actual_statuses == expected_statuses
  end

  defp reload_updates(updates) do
    Enum.map(updates, &Repo.reload/1)
  end

  defp insert_update_with_status(ctx, status) do
    update = GoalsFixtures.goal_update_fixture(ctx.creator, ctx.goal)

    # Update its status directly via SQL to bypass validations
    update_id = Ecto.UUID.dump!(update.id)

    update_sql = """
    UPDATE goal_updates
    SET status = $1
    WHERE id = $2
    """

    Repo.query!(update_sql, [status, update_id])
    %{update | status: status}
  end
end
