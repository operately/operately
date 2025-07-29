defmodule Operately.Data.Change069PopulateProjectMilestonesTimeframe do
  alias Operately.Repo
  alias Operately.Projects.Milestone
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  def run do
    milestones = Repo.all(Milestone)

    Enum.each(milestones, fn milestone ->
      update_milestone_timeframe(milestone)
    end)
  end

  defp build_timeframe(milestone) do
    contextual_start_date = build_contextual_start_date(milestone)
    contextual_end_date = build_contextual_end_date(milestone)

    %{
      contextual_start_date: contextual_start_date,
      contextual_end_date: contextual_end_date
    }
  end

  defp build_contextual_start_date(milestone) do
    start_date = Timeframe.start_date(milestone.timeframe)

    if is_nil(start_date) do
      ContextualDate.create_day_date(milestone.inserted_at)
    else
      milestone.timeframe.contextual_start_date
    end
  end

  defp build_contextual_end_date(milestone) do
    end_date = Timeframe.end_date(milestone.timeframe)

    if is_nil(end_date) do
      ContextualDate.create_day_date(milestone.deadline_at)
    else
      milestone.timeframe.contextual_end_date
    end
  end

  defp update_milestone_timeframe(milestone) do
    timeframe = build_timeframe(milestone)

    milestone
    |> Ecto.Changeset.change(%{timeframe: timeframe})
    |> Repo.update!()
  end
end
