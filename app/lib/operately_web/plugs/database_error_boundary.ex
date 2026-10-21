defmodule OperatelyWeb.Plugs.DatabaseErrorBoundary do
  @moduledoc """
  Wraps routing, including authentication, with the database overload response.

  The original failure is always reraised for Phoenix's transport handling and
  Sentry capture. Phoenix preserves a response that has already been sent.
  """

  @behaviour Plug

  alias OperatelyWeb.{DatabaseErrors, Router}

  @impl Plug
  def init(opts), do: Router.init(opts)

  @impl Plug
  def call(conn, opts) do
    Router.call(conn, opts)
  rescue
    error ->
      if DatabaseErrors.queue_timeout?(error) do
        conn = latest_conn(conn, error)
        DatabaseErrors.put_sentry_context(conn)
        send_unavailable(conn, error)
      end

      reraise error, __STACKTRACE__
  end

  defp latest_conn(_conn, %Plug.Conn.WrapperError{conn: conn}), do: conn
  defp latest_conn(conn, _error), do: conn

  defp send_unavailable(conn, error) do
    # A controller may have sent headers before raising without returning its
    # updated conn. Preserve the adapter signal for Phoenix's error renderer.
    receive do
      {:plug_conn, :sent} = sent -> send(self(), sent)
    after
      0 -> DatabaseErrors.respond(put_response_format(conn), error)
    end
  end

  defp put_response_format(conn) do
    # Phoenix's pipeline wrapper can retain the conn from before accepts/2 ran.
    # Use the matched route, rather than guessing from the URL or Accept header.
    case conn.private[:phoenix_format] do
      nil ->
        route = Phoenix.Router.route_info(Router, conn.method, conn.request_path, conn.host)

        pipelines =
          case route do
            %{pipe_through: pipelines} -> pipelines
            _ -> []
          end

        format = if :browser in pipelines, do: "html", else: "json"
        Phoenix.Controller.put_format(conn, format)

      _ ->
        conn
    end
  end
end
