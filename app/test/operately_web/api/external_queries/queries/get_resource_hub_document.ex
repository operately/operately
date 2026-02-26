defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetResourceHubDocument do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.document_id(ctx.document)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.document
    assert response.document.id == Paths.document_id(ctx.document)
  end
end
