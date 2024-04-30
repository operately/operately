defmodule Operately.Data.Change008ConvertGoalTimeframesToNewFormatTest do
  use Operately.DataCase

  test "convert quarter timeframes to new format" do
    {:ok, goal} = Operately.Repo.insert(%Operately.Goals.Goal{
      deprecated_timeframe: "Q1 2021",
      timeframe: nil
    })

    Operately.Data.Change008ConvertGoalTimeframesToNewFormat.run()

    goal = Operately.Goals.get_goal!(goal.id)
    assert %Operately.Goals.Timeframe{start_date: ~D[2021-01-01], end_date: ~D[2021-03-31], type: "quarter"} = goal.timeframe
  end

  test "convert annual timeframes to new format" do
    {:ok, goal} = Operately.Repo.insert(%Operately.Goals.Goal{
      deprecated_timeframe: "2022",
      timeframe: nil
    })

    Operately.Data.Change008ConvertGoalTimeframesToNewFormat.run()

    goal = Operately.Goals.get_goal!(goal.id)
    assert %Operately.Goals.Timeframe{start_date: ~D[2022-01-01], end_date: ~D[2022-12-31], type: "year"} = goal.timeframe
  end

  test "doesn't touch goals without deprecated timeframes" do
    {:ok, goal} = Operately.Repo.insert(%Operately.Goals.Goal{
      deprecated_timeframe: nil,
      timeframe: %Operately.Goals.Timeframe{start_date: ~D[2021-01-01], end_date: ~D[2021-03-31], type: "quarter"}
    })

    Operately.Data.Change008ConvertGoalTimeframesToNewFormat.run()

    goal = Operately.Goals.get_goal!(goal.id)
    assert %Operately.Goals.Timeframe{start_date: ~D[2021-01-01], end_date: ~D[2021-03-31], type: "quarter"} = goal.timeframe
  end
end
