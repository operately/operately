defmodule Operately.Data.Change053PopulateGoalLastUpdateStatusTest do
  use Operately.DataCase
  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal1, :marketing, name: "Goal 1")
    |> Factory.add_goal(:goal2, :marketing, name: "Goal 2")
    |> Factory.add_goal_update(:update1, :goal1, :creator)
    |> Factory.add_goal_update(:update2, :goal1, :creator)
    |> Factory.add_goal_update(:update3, :goal2, :creator)
  end

  test "updates goals with their latest updates", ctx do
    {:ok, _} = nullify_last_check_in_status()

    ctx = Factory.reload_all(ctx)
    assert ctx.goal1.last_update_status == nil
    assert ctx.goal2.last_update_status == nil

    # run the change
    Operately.Data.Change053PopulateGoalLastUpdateStatus.run()

    # assert that the last_check_in_id is updated correctly
    ctx = Factory.reload_all(ctx)
    assert ctx.goal1.last_update_status == ctx.update1.status
    assert ctx.goal2.last_update_status == ctx.update3.status
  end

  defp nullify_last_check_in_status do
    Repo.query("UPDATE goals SET last_update_status = NULL")
  end
end
