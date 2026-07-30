defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.UpdateKpiDataPoint do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/update_kpi_data_point"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_kpi(:kpi, :space, name: "Revenue")
    |> Factory.add_kpi_data_point(:data_point, :kpi, value: 100.0, recorded_for: ~D[2026-01-01])
  end

  @impl true
  def inputs(ctx) do
    %{data_point_id: Operately.ShortUuid.encode!(ctx.data_point.id), value: 250.0}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.data_point.value == 250.0
  end
end
