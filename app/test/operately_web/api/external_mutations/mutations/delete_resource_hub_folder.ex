defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DeleteResourceHubFolder do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "delete_resource_hub_folder"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_folder(:folder, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      folder_id: Paths.folder_id(ctx.folder)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
