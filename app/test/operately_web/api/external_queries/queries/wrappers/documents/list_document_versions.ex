defmodule OperatelyWeb.Api.ExternalQueries.Queries.Wrappers.Documents.ListDocumentVersions do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "documents/list_document_versions"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
  end

  @impl true
  def inputs(ctx), do: %{document_id: Paths.document_id(ctx.document)}

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.versions)
    assert length(response.versions) >= 1
  end
end
