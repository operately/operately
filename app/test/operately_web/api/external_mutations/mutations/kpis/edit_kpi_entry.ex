defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.EditKpiEntry do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  @impl true
  def mutation_name, do: "kpis/edit_kpi_entry"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi, value: 40.0, period: ~D[2026-01-01])

    ctx
    |> Map.put(:kpi, kpi)
    |> Map.put(:entry, entry)
  end

  @impl true
  def inputs(ctx) do
    %{
      entry_id: Paths.kpi_entry_id(ctx.entry),
      value: 42.0
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.entry.value == 42.0
    refute Map.has_key?(response, :error)
  end
end
