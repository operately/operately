defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.LogKpiEntry do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  @impl true
  def mutation_name, do: "kpis/log_kpi_entry"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)

    Map.put(ctx, :kpi, kpi)
  end

  @impl true
  def inputs(ctx) do
    %{
      kpi_id: Paths.kpi_id(ctx.kpi),
      value: 42.0,
      period: "2026-01-01"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.entry.value == 42.0
    assert response.entry.period == "2026-01-01"
    refute Map.has_key?(response, :error)
  end
end
