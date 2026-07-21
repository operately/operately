defmodule OperatelyWeb.Api.ExternalQueries.Queries.Documents.ListVersions do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "documents/list_versions"

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
    %{document_id: Paths.document_id(ctx.document)}
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.versions)
    assert length(response.versions) >= 1
    assert hd(response.versions).version_number
  end
end
