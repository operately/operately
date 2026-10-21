defmodule OperatelyWeb.DatabaseErrors do
  @moduledoc """
  Classifies database queue failures and builds their HTTP response.

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
  Sends a localized, non-cacheable 503 for a confirmed queue timeout.
  Browser routes receive HTML; API and other transports receive JSON.

  Pass the latest connection, including the connection from a Plug wrapper when
  applicable. Unrelated failures and responses already started return `:unhandled`
  so the caller can retain its existing error handling and logging.
  """
  @spec respond(Plug.Conn.t(), term()) :: {:ok, Plug.Conn.t()} | :unhandled
  def respond(%Plug.Conn{state: state} = conn, error) when state in [:unset, :set] do
    if queue_timeout?(error) do
      {content_type, body} = response_body(conn)

      conn =
        conn
        |> put_resp_content_type(content_type)
        |> put_resp_header("cache-control", "no-store")
        |> delete_resp_header("retry-after")
        |> send_resp(503, body)
        |> halt()

      {:ok, conn}
    else
      :unhandled
    end
  end

  def respond(%Plug.Conn{}, _error), do: :unhandled

  defp response_body(conn) do
    message = gettext("The service is temporarily unavailable. Please try again.")

    case conn.private[:phoenix_format] do
      "html" ->
        {"text/html", message |> Phoenix.HTML.html_escape() |> Phoenix.HTML.safe_to_string()}

      _ ->
        body = %{error: "Service Unavailable", code: "database_connection_queue_timeout", message: message}
        {"application/json", Jason.encode!(body)}
    end
  end
end
