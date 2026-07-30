defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.CreateKpi do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/create_kpi"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space), name: "Revenue"}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.kpi.name == "Revenue"
  end
end
