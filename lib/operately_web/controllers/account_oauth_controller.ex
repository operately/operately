defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  plug Ueberauth

  @rand_pass_length 32

  def callback(%{assigns: %{ueberauth_auth: %{info: account_info}}} = conn, %{"provider" => "google"}) do
    IO.inspect(account_info)

    account_params = %{email: account_info.email, password: random_password()}

    case People.fetch_or_create_account(account_params) do
      {:ok, account} ->
        AccountAuth.log_in_account(conn, account)

      _ ->
        conn
        |> put_flash(:error, "Authentication failed")
        |> redirect(to: "/")
    end
  end

  def callback(conn, _params) do
    conn
    |> put_flash(:error, "Authentication failed")
    |> redirect(to: "/")
  end

  #
  # The following section is used for testing purposes only.
  # It is not available in production.
  #
  # To use from Wallaby, visit the following path:
  #   /accounts/auth/test_login
  #
  # and provide the following query parameters:
  #   email: the email address of the user to log in as
  #
  if Application.compile_env(:operately, :test_routes) do
    def test_login(conn, params) do
      account_params = %{
        email: params["email"],
        password: random_password()
      }

      case People.fetch_or_create_account(account_params) do
        {:ok, account} ->
          AccountAuth.log_in_account(conn, account)

        _ ->
          conn
          |> put_flash(:error, "Authentication failed")
          |> redirect(to: "/")
      end
    end
  end

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end
end
