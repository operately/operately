defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias OperatelyWeb.AccountAuth

  def new(conn, _params) do
    allow_google_login = Application.get_env(:operately, :allow_login_with_google)

    render(conn, :new, error_message: nil, layout: false, allow_google_login: allow_google_login)
  end

  def create(conn, params) do
    email = params["email"]
    password = params["password"]

    account_params = %{email: email, password: password}
    account = Operately.People.get_account_by_email_and_password(email, password)

    if account do
      conn |> AccountAuth.log_in_account(account, account_params)
    else
      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      conn
      |> put_flash(:error, "Invalid email or password")
      |> put_flash(:email, String.slice(email, 0, 160))
      |> redirect(to: ~p"/accounts/log_in")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> AccountAuth.log_out_account()
  end
end
