defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DeleteResourceHubDocument do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "delete_resource_hub_document"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_document(:document, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      document_id: Paths.document_id(ctx.document)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.document.id
    refute Map.has_key?(response, :error)
  end
end
