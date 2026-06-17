defmodule OperatelyWeb.Api.ExternalQueries.Queries.Wrappers.Documents.ListContents do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "documents/list_contents"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
    |> Factory.add_document(:document, :hub)
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.nodes)
    assert is_list(response.draft_nodes)

    all_nodes = response.nodes ++ response.draft_nodes

    assert Enum.any?(all_nodes, fn node ->
             node[:document] && node.document.id == Paths.document_id(ctx.document)
           end)
  end
end
