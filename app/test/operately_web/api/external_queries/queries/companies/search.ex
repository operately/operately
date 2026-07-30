defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Search.SourceIndexer
  alias Operately.Support.Factory

  def query_name, do: "companies/search"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, name: "External full-text marker")

    assert {:ok, _summary} = SourceIndexer.sync("project", ctx.project.id)
    ctx
  end

  @impl true
  def inputs(_ctx), do: %{query: "External full-text marker"}

  @impl true
  def assert(response, ctx) do
    assert [%{id: id, type: "project"}] = response.results
    assert id == Operately.ShortUuid.encode!(ctx.project.id)
  end
end
