defmodule OperatelyWeb.Api.ExternalQueries.Queries.Kpis.ListKpis do
  use Operately.Support.ExternalApi.QuerySpec

  import Operately.KpisFixtures

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "kpis/list_kpis"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    kpi_fixture(ctx.creator, space_id: ctx.space.id, name: "Revenue")

    ctx
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.kpis)
    refute Map.has_key?(response, :error)
  end
end
