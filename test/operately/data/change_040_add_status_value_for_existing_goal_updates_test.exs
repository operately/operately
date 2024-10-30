defmodule Operately.Data.Change040AddStatusValueForExistingGoalUpdatesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 1]
  import Operately.GoalsFixtures

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  test "migration adds 'on_track' value to updates without status", ctx do
    updates = create_updates(ctx)

    Enum.each(updates, fn u ->
      refute u.status
    end)

    Operately.Data.Change040AddStatusValueForExistingGoalUpdates.run()

    updates = reload_updates(updates)

    Enum.each(updates, fn u ->
      assert u.status == :on_track
    end)
  end

  test "migration ignores updates with status", ctx do
    update1 = goal_update_fixture(ctx.creator, ctx.goal, status: :issue)
    update2 = goal_update_fixture(ctx.creator, ctx.goal, status: :caution)
    update3 = goal_update_fixture(ctx.creator, ctx.goal, status: :pending)
    update4 = goal_update_fixture(ctx.creator, ctx.goal, status: :on_track)

    Operately.Data.Change040AddStatusValueForExistingGoalUpdates.run()

    update1 = Repo.reload(update1)
    update2 = Repo.reload(update2)
    update3 = Repo.reload(update3)
    update4 = Repo.reload(update4)

    assert update1.status == :issue
    assert update2.status == :caution
    assert update3.status == :pending
    assert update4.status == :on_track
  end

  #
  # Helpers
  #

  defp create_updates(ctx) do
    updates = Enum.map(1..3, fn _ ->
      goal_update_fixture(ctx.creator, ctx.goal)
    end)

    {_, nil} = from(u in Operately.Goals.Update) |> Repo.update_all(set: [status: nil])

    reload_updates(updates)
  end

  defp reload_updates(updates) do
    Enum.map(updates, &(Repo.reload(&1)))
  end
end
