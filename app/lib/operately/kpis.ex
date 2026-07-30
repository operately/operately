defmodule Operately.Kpis do
  @moduledoc """
  Context for KPIs and their data points.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Kpis.{Kpi, DataPoint}

  def get_kpi(id), do: Repo.get(Kpi, id)
  def get_kpi!(id), do: Repo.get!(Kpi, id)

  def get_data_point!(id), do: Repo.get!(DataPoint, id)

  def list_space_kpis(space_id) do
    Kpi
    |> Kpi.scope_space(space_id)
    |> Repo.all()
  end

  def list_kpi_data_points(kpi_id) do
    from(d in DataPoint, where: d.kpi_id == ^kpi_id, order_by: d.recorded_for)
    |> Repo.all()
  end

  defdelegate create_kpi(creator, space, attrs), to: Operately.Operations.CreateKpi, as: :run
  defdelegate update_kpi(person, kpi, attrs), to: Operately.Operations.UpdateKpi, as: :run
  defdelegate delete_kpi(person, kpi), to: Operately.Operations.DeleteKpi, as: :run
  defdelegate add_data_point(person, kpi, attrs), to: Operately.Operations.AddKpiDataPoint, as: :run
  defdelegate update_data_point(person, data_point, attrs), to: Operately.Operations.UpdateKpiDataPoint, as: :run
end
