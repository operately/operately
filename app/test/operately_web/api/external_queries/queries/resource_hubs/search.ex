defmodule OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "resource_hubs/search"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub,
        name: "Research findings",
        content: RichText.rich_text("Distinctive customer evidence")
      )

    {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)
    ctx
  end

  @impl true
  def inputs(ctx) do
    %{resource_hub_id: Paths.resource_hub_id(ctx.hub), query: "customer evidence"}
  end

  @impl true
  def assert(response, ctx) do
    assert [%{id: id, type: "resource_hub_document"}] = response.results
    assert id == Paths.document_id(ctx.document)
  end
end
