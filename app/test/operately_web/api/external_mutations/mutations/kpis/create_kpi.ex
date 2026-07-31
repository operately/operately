defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.CreateKpi do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "kpis/create_kpi"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      name: "Revenue",
      unit: "$",
      cadence: "monthly"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.kpi.id
    assert response.kpi.name == "Revenue"
    refute Map.has_key?(response, :error)
  end
end
