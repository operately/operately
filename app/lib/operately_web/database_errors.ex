defmodule OperatelyWeb.DatabaseErrors do
  @moduledoc """
  Classifies database queue failures and builds their HTTP API response.

  Request boundaries must opt into this helper and preserve their existing handling
  when it returns `:unhandled`. This module neither rescues failures nor retries work.
  """

  use Gettext, backend: OperatelyWeb.Gettext

  import Plug.Conn

  @doc """
  Recognizes a connection queue timeout, including Plug's preserved exception wrapper.

  Exit reasons and application error tuples are deliberately not unwrapped: their
  owners must preserve and propagate the original exception explicitly.
  """
  @spec queue_timeout?(term()) :: boolean()
  def queue_timeout?(%DBConnection.ConnectionError{reason: :queue_timeout}), do: true
  def queue_timeout?(%Plug.Conn.WrapperError{kind: :error, reason: error}), do: queue_timeout?(error)
  def queue_timeout?(_), do: false

  @doc """
  Sends a localized, non-cacheable JSON 503 for a confirmed queue timeout.

  Pass the latest connection, including the connection from a Plug wrapper when
  applicable. Unrelated failures and responses already started return `:unhandled`
  so the caller can retain its existing error handling and logging.
  """
  @spec respond(Plug.Conn.t(), term()) :: {:ok, Plug.Conn.t()} | :unhandled
  def respond(%Plug.Conn{state: state} = conn, error) when state in [:unset, :set] do
    if queue_timeout?(error) do
      body = %{
        error: "Service Unavailable",
        code: "database_connection_queue_timeout",
        message: gettext("The service is temporarily unavailable. Please try again.")
      }

      conn =
        conn
        |> put_resp_content_type("application/json")
        |> put_resp_header("cache-control", "no-store")
        |> delete_resp_header("retry-after")
        |> send_resp(503, Jason.encode!(body))
        |> halt()

      {:ok, conn}
    else
      :unhandled
    end
  end

  def respond(%Plug.Conn{}, _error), do: :unhandled
end
