defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller

  require Logger

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  plug Ueberauth

  @rand_pass_length 32

  def callback(%{assigns: %{ueberauth_auth: %{info: account_info}}} = conn, %{"provider" => "google"}) do
    account_params = %{
      email: account_info.email,
      password: random_password(),
      person: %{
        avatar_url: account_info.image,
        email: account_info.email,
        full_name: account_info.name,
        handle: account_info.name
      }
    }

    case People.fetch_or_create_account(account_params) do
      {:ok, account} ->
        AccountAuth.log_in_account(conn, account)

      e ->
        Logger.error("Failed to fetch or create account: #{inspect(e)}")
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
        password: random_password(),
        person: %{
          email: params["email"],
          full_name: params["email"],
          handle: params["email"],
          avatar_url: "https://www.gravatar.com/avatar/#{:crypto.strong_rand_bytes(16) |> Base.encode16()}"
        }
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

  if Application.compile_env(:operately, :dev_routes) do
    def dev_login(conn, params) do
      account = People.get_account_by_email(params["email"])

      AccountAuth.log_in_account(conn, account)
    end
  end

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end
end
