defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetCompanies do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, ctx) do
    assert is_list(response.companies)
    assert Enum.any?(response.companies, fn company -> company.id == Paths.company_id(ctx.company) end)
  end
end
