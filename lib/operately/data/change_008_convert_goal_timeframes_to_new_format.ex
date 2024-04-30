defmodule Operately.Data.Change008ConvertGoalTimeframesToNewFormat do
  import Ecto.Query, warn: false

  def run do
    goals = Operately.Repo.all(Operately.Goals.Goal)
    Enum.each(goals, &update_goal_timeframe/1)
  end

  def update_goal_timeframe(goal) do
    if goal.deprecated_timeframe do
      new_timeframe = Operately.Goals.Timeframe.convert_old_timeframe(goal.deprecated_timeframe)

      {:ok, _} = Operately.Repo.update(Ecto.Changeset.change(goal, timeframe: new_timeframe))
    end
  end

end
