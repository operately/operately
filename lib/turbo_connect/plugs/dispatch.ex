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
      {:ok, result} ->  ok(conn, result)

      {:error, :not_found} -> not_found(conn, "The requested resource was not found")
      {:error, :not_found, message} -> not_found(conn, message)

      {:error, :bad_request} -> bad_request(conn, "The request was malformed")
      {:error, :bad_request, message} -> bad_request(conn, message)

      {:error, message} ->
        Logger.error("\n")
        Logger.error("Unexpected result from #{conn.assigns.turbo_req_name}: {:error, #{inspect(message)}}")
        Logger.error("Did you maybe want to use {:error, :not_found, message} or {:error, :bad_request, message} instead?")

        internal_server_error(conn, "An unexpected error occurred")

      e -> 
        Logger.error("\n")
        Logger.error("Unexpected return value from #{conn.assigns.turbo_req_name} handler: #{inspect(e)}\n")

        internal_server_error(conn, "An unexpected error occurred")
    end
  rescue
    e -> 
      Logger.error("\nErorr while processing #{conn.assigns.turbo_req_name} \n")
      Logger.error(Exception.format_banner(:error, e))
      Logger.error(Exception.format_stacktrace(__STACKTRACE__))

      internal_server_error(conn, "An unexpected error occurred")
  end

  defp ok(conn, result) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(result))
  end

  defp not_found(conn, message) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(404, Jason.encode!(%{error: "Not found", message: message}))
  end

  defp bad_request(conn, message) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(400, Jason.encode!(%{error: "Bad request", message: message}))
  end

  defp internal_server_error(conn, message) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(500, Jason.encode!(%{error: "Internal server error", message: message}))
  end
end
