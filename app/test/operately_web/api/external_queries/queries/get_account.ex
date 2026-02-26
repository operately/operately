defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetAccount do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, ctx) do
    account = Operately.People.get_account!(ctx.creator.account_id)

    assert response == %{
      account: %{
        full_name: account.full_name,
        site_admin: account.site_admin
      }
    }
  end
end
