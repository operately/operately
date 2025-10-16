defmodule Operately.Data.Change051PopulateGoalLastCheckInsTest do
  use Operately.DataCase
  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal1, :marketing, name: "Goal 1")
    |> Factory.add_goal(:goal2, :marketing, name: "Goal 2")
    |> Factory.add_goal(:goal3, :marketing, name: "Goal 3")
    |> Factory.add_goal_update(:update1, :goal1, :creator)
    |> Factory.add_goal_update(:update2, :goal1, :creator)
    |> Factory.add_goal_update(:update3, :goal2, :creator)
  end

  test "updates goals with their latest updates", ctx do
    :ok = nullify_last_check_ins()

    :ok = update_inserted_at(ctx.update1, ~N[2025-03-25 11:00:00])
    :ok = update_inserted_at(ctx.update2, ~N[2025-03-25 12:00:00])
    :ok = update_inserted_at(ctx.update3, ~N[2025-03-25 13:00:00])

    # make sure that the last_check_in_id is nil for all goals
    ctx = Factory.reload_all(ctx)

    assert ctx.goal1.last_check_in_id == nil
    assert ctx.goal2.last_check_in_id == nil
    assert ctx.goal3.last_check_in_id == nil

    # run the change
    Operately.Data.Change051PopulateGoalLastCheckIns.run()

    # assert that the last_check_in_id is updated correctly
    ctx = Factory.reload_all(ctx)
    assert ctx.goal1.last_check_in_id == ctx.update2.id
    assert ctx.goal2.last_check_in_id == ctx.update3.id
    assert ctx.goal3.last_check_in_id == nil
  end

  defp nullify_last_check_ins do
    {:ok, _} = Repo.query("UPDATE goals SET last_check_in_id = NULL")
    :ok
  end

  defp update_inserted_at(update, inserted_at) do
    {:ok, _} = Repo.update(Ecto.Changeset.change(update, inserted_at: inserted_at))
    :ok
  end
end
