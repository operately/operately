defmodule OperatelyWeb.Api.ExternalQueries.Queries.Wrappers.Documents.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "documents/search"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub,
        name: "Research findings",
        content: RichText.rich_text("Distinctive customer evidence")
      )

    {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)
    ctx
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space), query: "customer evidence"}
  end

  @impl true
  defdelegate assert(response, ctx), to: ResourceHubs.Search
end
