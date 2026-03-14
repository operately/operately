defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.List do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "companies/list"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, ctx) do
    assert is_list(response.companies)
    assert Enum.any?(response.companies, fn company -> company.id == Paths.company_id(ctx.company) end)
  end
end
