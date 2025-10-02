defmodule OperatelyWeb.AccountOauthController do
  use OperatelyWeb, :controller
  require Logger

  alias Operately.People
  alias Operately.InviteLinks
  alias Operately.Companies
  alias OperatelyWeb.AccountAuth
  alias OperatelyWeb.Paths

  plug :store_redirect_in_state when action == :request
  plug Ueberauth

  @doc """
  Stores the redirect_to parameter in the session before initiating OAuth flow.
  This ensures we can redirect the user to the correct page after authentication.
  """
  def store_redirect_in_state(conn, _opts) do
    conn
    |> maybe_store_redirect(conn.params["redirect_to"])
    |> maybe_store_invite_token(conn.params["invite_token"])
  end

  @doc """
  Handles the callback from Google OAuth authentication.

  After successful authentication:
  1. Retrieves the redirect_to parameter from the session
  2. Creates or fetches the user account
  3. Logs in the user and redirects them to the appropriate page
  """
  def callback(
        %{assigns: %{ueberauth_auth: %{info: account_info}}} = conn,
        params = %{"provider" => "google"}
      ) do
    {conn, redirect_params} = get_and_clear_redirect_params(conn, params)
    {conn, invite_token} = get_and_clear_invite_token(conn, params)

    account_attrs = %{
      email: account_info.email,
      name: account_info.name,
      image: account_info.image
    }

    case People.find_or_create_account(account_attrs) do
      {:ok, account} ->
        {redirect_params, conn} =
          maybe_handle_invite(conn, account, invite_token, redirect_params)

        params = Map.put(redirect_params, "remember_me", "true")
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

  defp get_and_clear_redirect_params(conn, params) do
    redirect_to = get_session(conn, :oauth_redirect_to)

    redirect_params =
      if redirect_to, do: Map.put(params, "redirect_to", redirect_to), else: params

    conn = delete_session(conn, :oauth_redirect_to)

    {conn, redirect_params}
  end

  defp get_and_clear_invite_token(conn, params) do
    invite_token = params["invite_token"] || get_session(conn, :oauth_invite_token)
    conn = delete_session(conn, :oauth_invite_token)

    {conn, normalize_invite_token(invite_token)}
  end

  defp maybe_store_redirect(conn, nil), do: conn
  defp maybe_store_redirect(conn, ""), do: conn

  defp maybe_store_redirect(conn, redirect_to),
    do: put_session(conn, :oauth_redirect_to, redirect_to)

  defp maybe_store_invite_token(conn, nil), do: conn
  defp maybe_store_invite_token(conn, ""), do: conn

  defp maybe_store_invite_token(conn, invite_token),
    do: put_session(conn, :oauth_invite_token, invite_token)

  defp maybe_handle_invite(conn, _account, nil, params), do: {params, conn}

  defp maybe_handle_invite(conn, account, invite_token, params) do
    case InviteLinks.join_company_via_invite_link(account, invite_token) do
      {:ok, {:person_created, person}} ->
        company = Companies.get_company!(person.company_id)
        path = Paths.home_path(company)
        {Map.put(params, "redirect_to", path), conn}

      {:error, _reason} ->
        {params, conn}
    end
  end

  defp normalize_invite_token(nil), do: nil
  defp normalize_invite_token(""), do: nil
  defp normalize_invite_token(token), do: token

  defp default_google_avatar do
    "https://example.com/test-google-avatar.png"
  end

  if Application.compile_env(:operately, :test_routes) do
    def test_google(conn, params) do
      verify_application_env()

      account =
        cond do
          params["account_id"] ->
            People.get_account!(params["account_id"])

          params["email"] ->
            attrs = %{
              email: params["email"],
              name: params["name"] || params["email"],
              image: params["image"] || default_google_avatar()
            }

            case People.find_or_create_account(attrs) do
              {:ok, account} -> account
              {:error, reason} -> raise "Failed to create account: #{inspect(reason)}"
            end

          true ->
            raise "Missing account identifier"
        end

      {conn, redirect_params} = get_and_clear_redirect_params(conn, params)
      {conn, invite_token} = get_and_clear_invite_token(conn, params)
      {redirect_params, conn} = maybe_handle_invite(conn, account, invite_token, redirect_params)
      params = Map.put(redirect_params, "remember_me", "true")

      AccountAuth.log_in_account(conn, account, params)
    end

    defp verify_application_env() do
      if Application.get_env(:operately, :app_env) != :test do
        raise "You are trying to use the test Google auth route in a non-test environment."
      end
    end
  end
end
