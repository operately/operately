defmodule OperatelyWeb.Api.Queries.GetAccountTest do
  use OperatelyWeb.TurboCase

  test "it requires authentication", ctx do
    assert {401, _} = query(ctx.conn, :get_account, %{})
  end

  test "when authenticated, it returns the current account's information", ctx do
    account = Operately.PeopleFixtures.account_fixture()

    conn = log_in_account(ctx.conn, account)
    assert {200, data} = query(conn, :get_account, %{})

    assert data == %{
      account: %{
        full_name: account.full_name,
        site_admin: account.site_admin,
      }
    }
  end

end
