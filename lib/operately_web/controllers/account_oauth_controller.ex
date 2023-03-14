defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  plug Ueberauth

  @rand_pass_length 32

  def callback(%{assigns: %{ueberauth_auth: %{info: account_info}}} = conn, %{"provider" => "google"}) do
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

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end
end
