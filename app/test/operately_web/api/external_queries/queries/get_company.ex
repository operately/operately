defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetCompany do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_company do
    setup &Factory.setup/1
    inputs &get_company_inputs/1
    assert &assert_get_company/2
  end

  def get_company_inputs(ctx) do
    %{id: Paths.company_id(ctx.company)}
  end

  def assert_get_company(response, ctx) do
    assert response.company
    assert response.company.id == Paths.company_id(ctx.company)
  end
end
