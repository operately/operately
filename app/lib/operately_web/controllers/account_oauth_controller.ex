defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller
  require Logger

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  plug :store_redirect_in_state when action == :request
  plug Ueberauth

  @doc """
  Stores the redirect_to parameter in the session before initiating OAuth flow.
  This ensures we can redirect the user to the correct page after authentication.
  """
  def store_redirect_in_state(conn, _opts) do
    case conn.params["redirect_to"] do
      nil -> conn
      redirect_to -> put_session(conn, :oauth_redirect_to, redirect_to)
    end
  end

  @doc """
  Handles the callback from Google OAuth authentication.

  After successful authentication:
  1. Retrieves the redirect_to parameter from the session
  2. Creates or fetches the user account
  3. Logs in the user and redirects them to the appropriate page
  """
  def callback(%{assigns: %{ueberauth_auth: %{info: account_info}}} = conn, params = %{"provider" => "google"}) do
    {conn, redirect_params} = get_and_clear_redirect_params(conn, params)

    account_attrs = %{
      email: account_info.email,
      name: account_info.name,
      image: account_info.image
    }

    case People.find_or_create_account(account_attrs) do
      {:ok, account} ->
        AccountAuth.log_in_account(conn, account, redirect_params)

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

  defp get_and_clear_redirect_params(conn, params) do
    redirect_to = get_session(conn, :oauth_redirect_to)
    redirect_params = if redirect_to, do: Map.put(params, "redirect_to", redirect_to), else: params
    conn = delete_session(conn, :oauth_redirect_to)

    {conn, redirect_params}
  end
end
