defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ResourceHubs.Rename do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "resource_hubs/rename"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{resource_hub_id: Paths.resource_hub_id(ctx.resource_hub), new_name: "  Team library  "}
  end

  @impl true
  def assert(response, ctx) do
    assert response.success
    assert Repo.reload(ctx.resource_hub).name == "Team library"
  end
end
