defmodule TurboConnect.Plugs.Dispatch do
  @moduledoc """
  Assumes that the request has been matched and resolved by the 
  `TurboConnect.Plugs.Match` plug. This plug calls the handler for the
  resolved request.
  """

  require Logger
  import Plug.Conn

  def init(_), do: []

  def call(conn, _opts) do
    with {:ok, result} <- conn.assigns.turbo_req_handler.call(conn) do
      conn |> send_resp(200, Jason.encode!(result))
    else
      {:error, body} -> conn |> send_resp(500, body)
    end
  rescue
    e -> 
      Logger.error(Exception.format_stacktrace(e))
      send_resp(conn, 500, "Internal Server Error")
  end
end
