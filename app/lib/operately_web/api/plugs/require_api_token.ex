defmodule OperatelyWeb.Api.Plugs.RequireApiToken do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case extract_token(conn) do
      {:ok, raw_token} ->
        authenticate(conn, raw_token)

      :error ->
        unauthorized(conn)
    end
  end

  defp extract_token(conn) do
    case get_req_header(conn, "authorization") do
      [auth_header | _rest] ->
        token = String.trim(auth_header)
        if token == "", do: :error, else: {:ok, token}

      _ ->
        :error
    end
  end

  defp authenticate(conn, raw_token) do
    case Operately.People.authenticate_api_token(raw_token) do
      {:ok, %{token: token, person: person, account: account, company: company}} ->
        Operately.People.touch_last_used(token)

        conn
        |> assign(:current_person, person)
        |> assign(:current_account, account)
        |> assign(:current_company, company)
        |> assign(:current_api_token, token)
        |> assign(:api_auth_mode, :api_token)

      _ ->
        unauthorized(conn)
    end
  end

  defp unauthorized(conn) do
    conn
    |> send_resp(401, "Unauthorized")
    |> halt()
  end
end
