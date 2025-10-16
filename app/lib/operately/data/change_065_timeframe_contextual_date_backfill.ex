defmodule Operately.Data.Change065TimeframeContextualDateBackfill do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Goals.Goal

  def run do
    goals_with_timeframes =
      Repo.all(
        from g in Goal,
          where: not is_nil(g.timeframe),
          select: g
      )

    {success_count, error_count} =
      Enum.reduce(goals_with_timeframes, {0, 0}, fn goal, {success, error} ->
        case update_goal_timeframe(goal) do
          {:ok, _} -> {success + 1, error}
          {:error, _} -> {success, error + 1}
        end
      end)

    {:ok, %{success_count: success_count, error_count: error_count}}
  end

  defp update_goal_timeframe(goal) do
    contextual_start_date = %{
      date_type: :day,
      value: Calendar.strftime(goal.timeframe.start_date, "%b %d, %Y"),
      date: goal.timeframe.start_date
    }

    contextual_end_date = %{
      date_type: :day,
      value: Calendar.strftime(goal.timeframe.end_date, "%b %d, %Y"),
      date: goal.timeframe.end_date
    }

    updated_timeframe = %{
      type: goal.timeframe.type,
      start_date: goal.timeframe.start_date,
      end_date: goal.timeframe.end_date,
      contextual_start_date: contextual_start_date,
      contextual_end_date: contextual_end_date
    }

    goal
    |> Goal.changeset(%{timeframe: updated_timeframe})
    |> Repo.update()
  end
end
