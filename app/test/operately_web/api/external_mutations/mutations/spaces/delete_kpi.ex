defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.DeleteKpi do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/delete_kpi"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_kpi(:kpi, :space, name: "Revenue")
  end

  @impl true
  def inputs(ctx) do
    %{kpi_id: Operately.ShortUuid.encode!(ctx.kpi.id)}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
  end
end
