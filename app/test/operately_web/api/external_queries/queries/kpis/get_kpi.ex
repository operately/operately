defmodule OperatelyWeb.Api.ExternalQueries.Queries.Kpis.GetKpi do
  use Operately.Support.ExternalApi.QuerySpec

  import Operately.KpisFixtures

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "kpis/get_kpi"

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
    assert response.kpi
    assert response.kpi.id == Paths.kpi_id(ctx.kpi)
  end
end
