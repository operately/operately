defmodule Operately.Kpis do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiEntry}

  @kpi_actions [
    "kpi_created",
    "kpi_edited",
    "kpi_deleted",
    "kpi_entry_logged"
  ]

  def kpi_actions, do: @kpi_actions

  def list_kpis(space_id) do
    from(k in Kpi, where: k.space_id == ^space_id, order_by: k.name)
    |> Repo.all()
  end

  @doc """
  Lists a space's KPIs ready to be rendered in a list: champion preloaded, and a
  bounded window of recent history per KPI. Every place that lists KPIs uses this
  so they all plot the same series.
  """
  def list_kpis_with_recent_entries(space_id) do
    list_kpis(space_id)
    |> Repo.preload(:champion)
    |> load_recent_entries()
  end

  def get_kpi(id), do: Repo.get(Kpi, id)
  def get_kpi!(id), do: Repo.get!(Kpi, id)

  def list_entries(kpi_id) do
    from(e in KpiEntry, where: e.kpi_id == ^kpi_id, order_by: e.period)
    |> Repo.all()
  end

  # How much history a list view carries per KPI: enough to plot a trend
  # inline, without the cost of loading the whole series for every KPI.
  @recent_entries_limit 12

  @doc """
  Loads the most recent entries of each KPI (oldest -> newest) into its `:entries`
  association, and its latest one into the virtual `:latest_entry` field. Uses a
  single query for the whole list, capped at #{@recent_entries_limit} entries per
  KPI, so the list view can render latest values and inline trends cheaply.
  """
  def load_recent_entries(kpis, limit \\ @recent_entries_limit) when is_list(kpis) do
    recent = recent_entries_by_kpi_id(Enum.map(kpis, & &1.id), limit)

    Enum.map(kpis, fn kpi ->
      entries = Map.get(recent, kpi.id, [])
      %{kpi | entries: entries, latest_entry: List.last(entries)}
    end)
  end

  defp recent_entries_by_kpi_id([], _limit), do: %{}

  defp recent_entries_by_kpi_id(kpi_ids, limit) do
    ranked =
      from(e in KpiEntry,
        where: e.kpi_id in ^kpi_ids,
        select: %{
          id: e.id,
          rank: row_number() |> over(partition_by: e.kpi_id, order_by: [desc: e.period, desc: e.inserted_at])
        }
      )

    from(e in KpiEntry,
      join: r in subquery(ranked),
      on: r.id == e.id,
      where: r.rank <= ^limit,
      order_by: [asc: e.kpi_id, asc: e.period, asc: e.inserted_at]
    )
    |> Repo.all()
    |> Repo.preload(:recorded_by)
    |> Enum.group_by(& &1.kpi_id)
  end

  defdelegate create_kpi(creator, attrs), to: Operately.Operations.KpiCreation, as: :run
  defdelegate edit_kpi(author, kpi, attrs), to: Operately.Operations.KpiEditing, as: :run
  defdelegate delete_kpi(author, kpi), to: Operately.Operations.KpiDeleting, as: :run
  defdelegate log_entry(author, kpi, attrs), to: Operately.Operations.KpiEntryLogging, as: :run
end
