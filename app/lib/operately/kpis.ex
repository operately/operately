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
    # Preload entries (ordered oldest -> newest) so the list view can render the
    # latest value / trend per KPI. A single batched preload query avoids N+1.
    entries = from(e in KpiEntry, order_by: e.period)

    from(k in Kpi, where: k.space_id == ^space_id, order_by: k.name)
    |> Repo.all()
    |> Repo.preload(entries: entries)
  end

  def get_kpi(id), do: Repo.get(Kpi, id)
  def get_kpi!(id), do: Repo.get!(Kpi, id)

  def list_entries(kpi_id) do
    from(e in KpiEntry, where: e.kpi_id == ^kpi_id, order_by: e.period)
    |> Repo.all()
  end

  defdelegate create_kpi(creator, attrs), to: Operately.Operations.KpiCreation, as: :run
  defdelegate edit_kpi(author, kpi, attrs), to: Operately.Operations.KpiEditing, as: :run
  defdelegate delete_kpi(author, kpi), to: Operately.Operations.KpiDeleting, as: :run
  defdelegate log_entry(author, kpi, attrs), to: Operately.Operations.KpiEntryLogging, as: :run
end
