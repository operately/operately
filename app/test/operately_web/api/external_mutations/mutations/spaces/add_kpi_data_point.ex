defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.AddKpiDataPoint do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/add_kpi_data_point"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_kpi(:kpi, :space, name: "Revenue")
  end

  @impl true
  def inputs(ctx) do
    %{kpi_id: Operately.ShortUuid.encode!(ctx.kpi.id), value: 100.0, recorded_for: "2026-01-01"}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.data_point.value == 100.0
  end
end
