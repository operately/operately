defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  def new(conn, _params) do
    render(conn, :new, error_message: nil)
  end

  def create(conn, %{"account" => account_params}) do
    %{"email" => email, "password" => password} = account_params

    if account = People.get_account_by_email_and_password(email, password) do
      conn
      |> put_flash(:info, "Welcome back!")
      |> AccountAuth.log_in_account(account, account_params)
    else
      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      render(conn, :new, error_message: "Invalid email or password")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> AccountAuth.log_out_account()
  end
end
