defmodule Operately.Data.Change067PopulateProjectTimeframe do
  alias Operately.Repo
  alias Operately.ContextualDates.{Timeframe, ContextualDate}
  alias __MODULE__.Project

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

    Project.changeset(project, %{timeframe: timeframe})
    |> Repo.update!()
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      field :started_at, :utc_datetime
      field :deadline, :utc_datetime

      embeds_one :timeframe, Operately.ContextualDates.Timeframe, on_replace: :delete

      timestamps()
    end

    def changeset(project, attrs) do
      project
      |> cast(attrs, [:started_at, :deadline])
      |> cast_embed(:timeframe)
    end
  end
end
