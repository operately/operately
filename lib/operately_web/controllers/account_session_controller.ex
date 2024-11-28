defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias OperatelyWeb.AccountAuth

  def create(conn, params) do
    email = params["email"]
    password = params["password"]

    account_params = %{email: email, password: password}
    account = Operately.People.get_account_by_email_and_password(email, password)

    if account do
      AccountAuth.log_in_account(conn, account, account_params)
    else
      conn |> send_resp(401, "")
    end
  end

  def delete(conn, _params) do
    conn |> AccountAuth.log_out_account()
  end

  if Application.compile_env(:operately, :test_routes) do
    def test_login(conn, params) do
      account = Operately.People.get_account_by_email(params["email"])

      if account do
        conn
        |> clear_session() # make sure that redirect_to is not in the session
        |> AccountAuth.log_in_account(account)
      else
        conn
        |> redirect(to: "/")
      end
    end
  end
end
