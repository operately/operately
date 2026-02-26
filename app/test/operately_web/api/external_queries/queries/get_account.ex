defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetAccount do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory

  query :get_account do
    setup &Factory.setup/1
    assert &assert_get_account/2
  end

  def assert_get_account(response, ctx) do
    account = Operately.People.get_account!(ctx.creator.account_id)

    assert response == %{
      account: %{
        full_name: account.full_name,
        site_admin: account.site_admin
      }
    }
  end
end
