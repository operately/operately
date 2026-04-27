defmodule OperatelyWeb.Api.Plugs.RequireCliAuthSession do
  import Plug.Conn

  alias Operately.People.CliAuthSession

  def init(opts), do: opts

  def call(conn, opts) do
    if protected_endpoint?(conn, opts[:only] || []) do
      case extract_token(conn) do
        {:ok, raw_token} ->
          authenticate(conn, raw_token)

        :error ->
          unauthorized(conn)
      end
    else
      conn
    end
  end

  defp protected_endpoint?(conn, only) do
    {conn.assigns[:turbo_req_type], conn.assigns[:turbo_req_name]} in only
  end

  defp extract_token(conn) do
    case get_req_header(conn, "authorization") do
      [auth_header | _rest] ->
        token =
          case String.split(String.trim(auth_header), " ", parts: 2) do
            ["Bearer", t] -> String.trim(t)
            [t] -> String.trim(t)
            _ -> ""
          end

        if token == "", do: :error, else: {:ok, token}

      _ ->
        :error
    end
  end

  defp authenticate(conn, raw_token) do
    case CliAuthSession.authenticate(raw_token) do
      {:ok, session} ->
        conn
        |> assign(:current_cli_auth_session, session)
        |> maybe_assign_account(session)

      {:error, :unauthorized} ->
        unauthorized(conn)
    end
  end

  defp maybe_assign_account(conn, %{account: %{} = account}), do: assign(conn, :current_account, account)
  defp maybe_assign_account(conn, _session), do: conn

  defp unauthorized(conn) do
    conn
    |> send_resp(401, "Unauthorized")
    |> halt()
  end
end
