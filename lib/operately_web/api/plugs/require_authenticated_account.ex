defmodule OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount do
  import Plug.Conn

  def init(_opts), do: nil

  def call(conn, _opts) do
    case conn.assigns[:current_account] do
      nil ->
        conn
        |> send_resp(401, "Unauthorized")
        |> halt()
      _ ->
        conn
    end
  end
end
