defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.DeleteKpi do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  @impl true
  def mutation_name, do: "kpis/delete_kpi"

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
    %{kpi_id: Paths.kpi_id(ctx.kpi)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.kpi.id
    refute Map.has_key?(response, :error)
    assert Kpis.get_kpi(ctx.kpi.id) == nil
  end
end
