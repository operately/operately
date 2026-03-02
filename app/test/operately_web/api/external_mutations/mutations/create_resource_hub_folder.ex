defmodule OperatelyWeb.Api.ExternalMutations.Mutations.CreateResourceHubFolder do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "create_resource_hub_folder"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_hub_id: Paths.resource_hub_id(ctx.resource_hub),
      name: "Updated Name"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.folder.id
    refute Map.has_key?(response, :error)
  end
end
