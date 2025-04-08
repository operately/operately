defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller
  require Logger

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  plug Ueberauth

  def callback(%{assigns: %{ueberauth_auth: %{info: account_info}}} = conn, params = %{"provider" => "google"}) do
    attrs = %{
      email: account_info.email,
      name: account_info.name,
      image: account_info.image
    }

    case People.find_or_create_account(attrs) do
      {:ok, account} ->
        AccountAuth.log_in_account(conn, account, params)

      e ->
        Logger.error("Failed to fetch or create account: #{inspect(e)}")
        conn |> redirect(to: "/")
    end
  end

  def callback(conn, _params) do
    conn
    |> put_flash(:error, "Authentication failed")
    |> redirect(to: "/")
  end

end
