defmodule OperatelyWeb.Api.ExternalQueries.Queries.Documents.GetVersion do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "documents/get_version"

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
    %{
      document_id: Paths.document_id(ctx.document),
      version_number: 1
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.version
    assert response.version.version_number == 1
    assert response.version.title == ctx.document.name
    assert response.version.content
  end
end
