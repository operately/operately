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
    res = conn.assigns.turbo_req_handler.call(conn, conn.assigns.turbo_inputs)

    case res do
      {:ok, result} -> 
        conn 
        |> put_resp_content_type("application/json")
        |> send_resp(200, Jason.encode!(result))

      {:error, :not_found} -> conn |> send_resp(404, "Not found")
      {:error, :bad_request} -> conn |> send_resp(400, "Bad request")

      e = {:error, _body} -> 
        Logger.error("\nUnexpected return value from #{conn.assigns.turbo_req_name} handler: #{inspect(e)}\n")
        conn |> send_resp(500, "Internal Server Error")

      e -> 
        Logger.error("\nUnexpected return value from #{conn.assigns.turbo_req_name} handler: #{inspect(e)}\n")
        conn |> send_resp(500, "Internal Server Error")
    end
  rescue
    e -> 
      Logger.error("\nErorr while processing #{conn.assigns.turbo_req_name} \n")
      Logger.error(Exception.format_banner(:error, e))
      Logger.error(Exception.format_stacktrace(__STACKTRACE__))
      send_resp(conn, 500, "Internal Server Error")
  end
end
