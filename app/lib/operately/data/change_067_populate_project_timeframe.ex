defmodule Operately.Data.Change067PopulateProjectTimeframe do
  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  def run do
    projects = Repo.all(Project)

    Enum.each(projects, fn project ->
      update_project_timeframe(project)
    end)
  end

  defp build_timeframe(project) do
    contextual_start_date = build_contextual_start_date(project)
    contextual_end_date = build_contextual_end_date(project)

    %Timeframe{
      contextual_start_date: contextual_start_date,
      contextual_end_date: contextual_end_date
    }
  end

  defp build_contextual_start_date(project) do
    cond do
      not is_nil(project.started_at) -> ContextualDate.create_day_date(project.started_at)
      not is_nil(project.inserted_at) -> ContextualDate.create_day_date(project.inserted_at)
      true -> nil
    end
  end

  defp build_contextual_end_date(project) do
    case project.deadline do
      nil -> nil
      deadline -> ContextualDate.create_day_date(deadline)
    end
  end

  defp update_project_timeframe(project) do
    timeframe = build_timeframe(project)

    project
    |> Ecto.Changeset.change(%{timeframe: timeframe})
    |> Repo.update!()
  end
end
