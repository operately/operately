defmodule OperatelyWeb.AccountAuth do
  import Plug.Conn
  import Phoenix.Controller

  alias Operately.People

  # Make the remember me cookie valid for 60 days.
  # If you want bump or reduce this value, also change
  # the token expiry itself in AccountToken.
  @max_age 60 * 60 * 24 * 60
  @remember_me_cookie "_operately_web_account_remember_me"
  @remember_me_options [sign: true, max_age: @max_age, same_site: "Lax"]

  @doc """
  Logs the account in.

  It renews the session ID and clears the whole session
  to avoid fixation attacks. See the renew_session
  function to customize this behaviour.
  """
  def log_in_account(conn, account, params \\ %{}) do
    token = People.generate_account_session_token(account)
    path = get_session(conn, :redirect_to) || after_login_path(account)

    conn
    |> renew_session()
    |> put_token_in_session(token)
    |> maybe_write_remember_me_cookie(token, params)
    |> redirect(to: path)
  end

  defp maybe_write_remember_me_cookie(conn, token, %{"remember_me" => "true"}) do
    put_resp_cookie(conn, @remember_me_cookie, token, @remember_me_options)
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params) do
    conn
  end

  @spec after_login_path(Operately.Account.t) :: String.t
  defp after_login_path(account) do
    companies = Operately.Companies.list_companies(account)

    if length(companies) == 1 do
      OperatelyWeb.Paths.home_path(hd(companies))
    else
      "/"
    end
  end

  # This function renews the session ID and erases the whole
  # session to avoid fixation attacks. If there is any data
  # in the session you may want to preserve after log in/log out,
  # you must explicitly fetch the session data before clearing
  # and then immediately set it after clearing, for example:
  #
  #     defp renew_session(conn) do
  #       preferred_locale = get_session(conn, :preferred_locale)
  #
  #       conn
  #       |> configure_session(renew: true)
  #       |> clear_session()
  #       |> put_session(:preferred_locale, preferred_locale)
  #     end
  #
  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  @doc """
  Logs the account out.

  It clears all session data for safety. See renew_session.
  """
  def log_out_account(conn) do
    account_token = get_session(conn, :account_token)
    account_token && People.delete_account_session_token(account_token)

    if live_socket_id = get_session(conn, :live_socket_id) do
      OperatelyWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
    |> send_resp(200, "")
  end

  @doc """
  Authenticates the account by looking into the session
  and remember me token.
  """
  def fetch_current_account(conn, _opts) do
    {account_token, conn} = ensure_account_token(conn)
    account = account_token && People.get_account_by_session_token(account_token)

    assign(conn, :current_account, account)
  end

  def fetch_current_company(conn, _opts) do
    case get_req_header(conn, "x-company-id") do
      [company_id] ->
        id = OperatelyWeb.Api.Helpers.id_without_comments(company_id)
        {:ok, id} = Operately.Companies.ShortId.decode(id)

        company = Operately.Companies.get_company!(id)
        assign(conn, :current_company, company)

      _ ->
        conn
    end
  end

  def fetch_current_person(conn, _opts) do
    if conn.assigns[:current_account] && conn.assigns[:current_company] do
      account = conn.assigns[:current_account]
      company = conn.assigns[:current_company]

      person = Operately.People.get_person!(account, company)

      assign(conn, :current_person, person)
    else
      conn
    end
  end

  defp ensure_account_token(conn) do
    if token = get_session(conn, :account_token) do
      {token, conn}
    else
      conn = fetch_cookies(conn, signed: [@remember_me_cookie])

      if token = conn.cookies[@remember_me_cookie] do
        {token, put_token_in_session(conn, token)}
      else
        {nil, conn}
      end
    end
  end

  @doc """
  Used for routes that require the account to not be authenticated.
  """
  def redirect_if_account_is_authenticated(conn, _opts) do
    if conn.assigns[:current_account] do
      conn
      |> redirect(to: after_login_path(conn.assigns[:current_account]))
      |> halt()
    else
      conn
    end
  end

  @doc """
  Used for routes that require the account to be authenticated.

  If you want to enforce the account email is confirmed before
  they use the application at all, here would be a good place.
  """
  def require_authenticated_account(conn, _opts) do
    if conn.assigns[:current_account] do
      conn
    else
      conn
      |> maybe_store_return_to()
      |> redirect(to: "/log_in")
      |> halt()
    end
  end

  defp put_token_in_session(conn, token) do
    conn
    |> put_session(:account_token, token)
    |> put_session(:live_socket_id, "accounts_sessions:#{Base.url_encode64(token)}")
  end

  defp maybe_store_return_to(%{method: "GET"} = conn) do
    put_session(conn, :account_return_to, current_path(conn))
  end

  defp maybe_store_return_to(conn), do: conn
end
