defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.Get do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "companies/get"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def inputs(ctx) do
    %{id: Paths.company_id(ctx.company)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.company
    assert response.company.id == Paths.company_id(ctx.company)
  end
end
