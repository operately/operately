defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias OperatelyWeb.AccountAuth

  def create(conn, params) do
    email = params["email"]
    password = params["password"]

    account_params = %{email: email, password: password}
    account = Operately.People.get_account_by_email_and_password(email, password)

    if account do
      conn |> AccountAuth.log_in_account(account, account_params)
    else
      conn |> put_status(401)
    end
  end

  def delete(conn, _params) do
    conn |> AccountAuth.log_out_account()
  end
end
