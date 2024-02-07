defmodule Operately.Data.ConvertGoalCheckInsToMonthly do
  alias Operately.Repo
  alias Operately.Goals.Goal

  def run do
    date = DateTime.new!(~D[2024-03-01], ~T[00:00:00], "Etc/UTC")

    Repo.all(Goal) 
    |> Enum.each(fn g -> Operately.Goals.update_goal(g, %{next_update_scheduled_at: date}) end)
  end
end
