defmodule OperatelyWeb.AccountTestSessionController do
  @moduledoc """
  
  This is a test only route that allows you to log in as a specific account.
  It is not available in production, and is only available in the test environment.
  
  To use from Wallaby, visit the following path:
    /accounts/auth/test_login?email=<account-email>
  """

  use OperatelyWeb, :controller

  if Application.compile_env(:operately, :test_routes) do
    alias Operately.People
    alias OperatelyWeb.AccountAuth

    def test_login(conn, params) do
      account = People.get_account_by_email(params["email"])

      if account do
        AccountAuth.log_in_account(conn, account)
      else
        conn
        |> put_flash(:error, "Authentication failed")
        |> redirect(to: "/")
      end
    end
  end
end
