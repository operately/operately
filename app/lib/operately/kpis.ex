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

  def get_kpi(id), do: Repo.get(Kpi, id)
  def get_kpi!(id), do: Repo.get!(Kpi, id)

  def list_entries(kpi_id) do
    from(e in KpiEntry, where: e.kpi_id == ^kpi_id, order_by: e.period)
    |> Repo.all()
  end

  @doc """
  Populates the virtual `:latest_entry` field of each KPI with its most recent
  entry (by period). Uses a single `DISTINCT ON` query for the whole list so the
  list view can render latest values without preloading full entry history.
  """
  def load_latest_entries(kpis) when is_list(kpis) do
    latest = latest_entries_by_kpi_id(Enum.map(kpis, & &1.id))
    Enum.map(kpis, fn kpi -> %{kpi | latest_entry: Map.get(latest, kpi.id)} end)
  end

  defp latest_entries_by_kpi_id([]), do: %{}

  defp latest_entries_by_kpi_id(kpi_ids) do
    from(e in KpiEntry,
      where: e.kpi_id in ^kpi_ids,
      distinct: e.kpi_id,
      order_by: [asc: e.kpi_id, desc: e.period, desc: e.inserted_at]
    )
    |> Repo.all()
    |> Repo.preload(:recorded_by)
    |> Map.new(fn entry -> {entry.kpi_id, entry} end)
  end

  defdelegate create_kpi(creator, attrs), to: Operately.Operations.KpiCreation, as: :run
  defdelegate edit_kpi(author, kpi, attrs), to: Operately.Operations.KpiEditing, as: :run
  defdelegate delete_kpi(author, kpi), to: Operately.Operations.KpiDeleting, as: :run
  defdelegate log_entry(author, kpi, attrs), to: Operately.Operations.KpiEntryLogging, as: :run
end
