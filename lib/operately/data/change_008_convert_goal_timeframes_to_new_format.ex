defmodule Operately.Data.Change008ConvertGoalTimeframesToNewFormat do
  import Ecto.Query, warn: false

  def run do
    goals = Operately.Repo.all(Operately.Goals.Goal)
    Enum.each(goals, &update_goal_timeframe/1)
  end

  def update_goal_timeframe(goal) do
    if goal.deprecated_timeframe do
      {:ok, _} = Operately.Repo.update(Ecto.Changeset.change(goal, timeframe: old_to_new_timeframe(goal.deprecated_timeframe)))
    end
  end

  defp old_to_new_timeframe(old_timeframe) do
    parts = String.split(old_timeframe, " ")

    if Enum.count(parts) == 1 do
      {year, _} = Integer.parse(parts)

      %{
        start_date: Date.from_iso8601!("#{year}-01-01"),
        end_date: Date.from_iso8601!("#{year}-12-31"),
        type: "year"
      }
    else
      [quarter, year] = parts

      [start_month, end_month] = case quarter do
        "Q1" -> [1, 3]
        "Q2" -> [4, 6]
        "Q3" -> [7, 9]
        "Q4" -> [10, 12]
      end

      %{
        start_date: Date.from_iso8601!("#{year}-#{start_month}-01"),
        end_date: Date.from_iso8601!("#{year}-#{end_month}-31"),
        type: "quarter"
      }
    end
  end

end
