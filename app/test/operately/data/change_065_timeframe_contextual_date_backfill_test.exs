defmodule Operately.Data.Change065TimeframeContextualDateBackfillTest do
  use Operately.DataCase

  alias Operately.Repo

  describe "TimeframeContextualDateBackfill" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "adds contextual dates to a goal's timeframe", ctx do
      start_date = ~D[2023-01-01]
      end_date = ~D[2023-12-31]

      ctx = Factory.add_goal(ctx, :goal, :space, timeframe: %{type: "year", start_date: start_date, end_date: end_date})

      Operately.Data.Change065TimeframeContextualDateBackfill.run()

      goal = Repo.reload(ctx.goal)

      assert goal.timeframe.contextual_start_date.date_type == :day
      assert goal.timeframe.contextual_start_date.value == "2023-01-01"
      assert goal.timeframe.contextual_start_date.date == start_date

      assert goal.timeframe.contextual_end_date.date_type == :day
      assert goal.timeframe.contextual_end_date.value == "2023-12-31"
      assert goal.timeframe.contextual_end_date.date == end_date
    end

    test "run/0 backfills contextual dates for all goals with timeframes", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal1, :space, timeframe: %{type: "year", start_date: ~D[2023-01-01], end_date: ~D[2023-12-31]})
        |> Factory.add_goal(:goal2, :space, timeframe: %{type: "quarter", start_date: ~D[2023-04-01], end_date: ~D[2023-06-30]})

      {:ok, result} = Operately.Data.Change065TimeframeContextualDateBackfill.run()

      assert result.success_count == 2
      assert result.error_count == 0

      goal1 = Repo.reload(ctx.goal1)
      assert goal1.timeframe.contextual_start_date.date_type == :day
      assert goal1.timeframe.contextual_start_date.value == "2023-01-01"
      assert goal1.timeframe.contextual_end_date.date_type == :day
      assert goal1.timeframe.contextual_end_date.value == "2023-12-31"

      goal2 = Repo.reload(ctx.goal2)
      assert goal2.timeframe.contextual_start_date.date_type == :day
      assert goal2.timeframe.contextual_start_date.value == "2023-04-01"
      assert goal2.timeframe.contextual_end_date.date_type == :day
      assert goal2.timeframe.contextual_end_date.value == "2023-06-30"
    end
  end
end
