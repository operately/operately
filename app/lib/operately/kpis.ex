defmodule Operately.Kpis do
  @moduledoc """
  The Kpis context.

  KPIs (key performance indicators) live inside a space and track a named
  metric over time. Each recorded measurement is stored as a `KpiValue`.
  """

  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Kpis.Kpi
  alias Operately.Kpis.KpiValue

  def list_kpis(space_id) do
    from(k in Kpi,
      where: k.space_id == ^space_id and is_nil(k.archived_at),
      order_by: [asc: k.inserted_at]
    )
    |> Repo.all()
  end

  def get_kpi!(id), do: Repo.get!(Kpi, id)

  def create_kpi(attrs \\ %{}) do
    attrs
    |> Kpi.changeset()
    |> Repo.insert()
  end

  def update_kpi(%Kpi{} = kpi, attrs \\ %{}) do
    kpi
    |> Kpi.changeset(attrs)
    |> Repo.update()
  end

  def archive_kpi(%Kpi{} = kpi) do
    now = NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)

    kpi
    |> Kpi.changeset(%{archived_at: now})
    |> Repo.update()
  end

  def create_kpi_value(attrs \\ %{}) do
    attrs
    |> KpiValue.changeset()
    |> Repo.insert()
  end

  def list_kpi_values(kpi_id) do
    from(v in KpiValue,
      where: v.kpi_id == ^kpi_id,
      order_by: [asc: v.recorded_at]
    )
    |> Repo.all()
  end
end
