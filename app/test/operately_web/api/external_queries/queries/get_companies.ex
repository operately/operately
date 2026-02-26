defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetCompanies do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_companies do
    setup &Factory.setup/1
    assert &assert_get_companies/2
  end

  def assert_get_companies(response, ctx) do
    assert is_list(response.companies)
    assert Enum.any?(response.companies, fn company -> company.id == Paths.company_id(ctx.company) end)
  end
end
