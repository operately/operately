defmodule Operately.Data.Change051PopulateGoalLastCheckInsTest do
  use Operately.DataCase
  alias Operately.Repo
  alias Operately.ContextualDates.Timeframe

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal1, :marketing, name: "Goal 1", timeframe: Timeframe.current_year())
    |> Factory.add_goal(:goal2, :marketing, name: "Goal 2", timeframe: Timeframe.last_year())
    |> Factory.add_goal_update(:update1, :goal1, :creator)
    |> Factory.add_goal_update(:update2, :goal1, :creator)
    |> Factory.add_goal_update(:update3, :goal2, :creator)
  end

  test "updates goals with their latest updates", ctx do
    {:ok, _} = nullify_last_check_ins()

    ctx = Factory.reload_all(ctx)
    assert ctx.update1.timeframe == nil
    assert ctx.update2.timeframe == nil
    assert ctx.update3.timeframe == nil

    # run the change
    Operately.Data.Change052PopulateGoalUpdateTimeframes.run()

    # assert that the last_check_in_id is updated correctly
    ctx = Factory.reload_all(ctx)
    assert ctx.update1.timeframe == ctx.goal1.timeframe
    assert ctx.update2.timeframe == ctx.goal1.timeframe
    assert ctx.update3.timeframe == ctx.goal2.timeframe
  end

  defp nullify_last_check_ins do
    Repo.query("UPDATE goal_updates SET timeframe = NULL")
  end
end
