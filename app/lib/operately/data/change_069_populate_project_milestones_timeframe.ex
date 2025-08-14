defmodule Operately.Data.Change069PopulateProjectMilestonesTimeframe do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  def run do
    milestones = Repo.all(
      from(m in Operately.Projects.Milestone,
      where: is_nil(m.deleted_at),
      select: %{
        id: m.id,
        inserted_at: m.inserted_at,
        deadline_at: m.deadline_at,
        timeframe: m.timeframe
      })
    )

    Enum.each(milestones, fn milestone ->
      update_milestone_timeframe(milestone)
    end)
  end

  defp build_timeframe(milestone) do
    contextual_start_date = build_contextual_start_date(milestone)
    contextual_end_date = build_contextual_end_date(milestone)

    %{
      contextual_start_date: Map.from_struct(contextual_start_date),
      contextual_end_date: Map.from_struct(contextual_end_date)
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

    {:ok, _} = from(m in Operately.Projects.Milestone, where: m.id == ^milestone.id)
    |> Repo.one()
    |> Ecto.Changeset.change(timeframe: timeframe)
    |> Repo.update()
  end
end
