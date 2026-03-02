defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DeleteResourceHubLink do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "delete_resource_hub_link"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_link(:link, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      link_id: Paths.link_id(ctx.link)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
