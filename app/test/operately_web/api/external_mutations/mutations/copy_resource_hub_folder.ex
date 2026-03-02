defmodule OperatelyWeb.Api.ExternalMutations.Mutations.CopyResourceHubFolder do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "copy_resource_hub_folder"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_folder(:folder, :resource_hub)
    |> Factory.add_resource_hub(:destination_resource_hub, :space, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      folder_name: "Updated Name",
      folder_id: Paths.folder_id(ctx.folder),
      dest_resource_hub_id: Paths.resource_hub_id(ctx.destination_resource_hub)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.folder_id
    refute Map.has_key?(response, :error)
  end
end
