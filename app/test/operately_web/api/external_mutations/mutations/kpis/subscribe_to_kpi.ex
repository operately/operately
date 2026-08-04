defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.SubscribeToKpi do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  @impl true
  def mutation_name, do: "kpis/subscribe_to_kpi"

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
  def assert(response, _ctx) do
    assert response.success == true
    refute Map.has_key?(response, :error)
  end
end
