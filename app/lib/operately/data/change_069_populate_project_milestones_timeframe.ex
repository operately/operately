defmodule Operately.Data.Change069PopulateProjectMilestonesTimeframe do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.ContextualDates.{Timeframe, ContextualDate}
  alias __MODULE__.Milestone

  def run do
    milestones = Repo.all(from(m in Milestone, where: is_nil(m.deleted_at)))

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

    {:ok, _} = from(m in Milestone, where: m.id == ^milestone.id)
    |> Repo.one()
    |> Ecto.Changeset.change(timeframe: timeframe)
    |> Repo.update()
  end

  defmodule Milestone do
    use Operately.Schema

    schema "project_milestones" do
      field :deadline_at, :naive_datetime
      embeds_one :timeframe, Operately.ContextualDates.Timeframe, on_replace: :delete

      soft_delete()
      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(milestone, attrs) do
      milestone
      |> cast(attrs, [:deadline_at, :deleted_at])
      |> cast_embed(:timeframe)
    end
  end
end
