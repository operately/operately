defmodule OperatelyWeb.Logger do
  require Logger
  import Plug.Conn

  @behaviour Plug

  def init(opts), do: opts

  def call(conn, _opts) do
    start_time = System.monotonic_time()

    register_before_send(conn, fn conn ->
      stop_time = System.monotonic_time()
      duration = System.convert_time_unit(stop_time - start_time, :native, :millisecond)

      log_request(conn, duration)
      conn
    end)
  end

  defp log_request(conn, duration) do
    unless should_skip_logging?(conn) do
      user = create_user_info(conn)
      method = create_method_info(conn)
      path = create_path_info(conn)
      status = create_status_info(conn)
      duration = create_duration_info(duration)

      Logger.info("#{status} #{user}#{method}#{path}#{duration}")
    end
  end

  defp should_skip_logging?(conn) do
    String.starts_with?(conn.request_path, "/health")
  end

  defp create_user_info(conn) do
    app_env = Application.get_env(:operately, :app_env)

    user_id =
      case conn.assigns[:current_account] do
        %{id: id} -> id
        _ -> "anonymous"
      end

    if app_env == :prod do
      "user=#{user_id} "
    else
      ""
    end
  end

  defp create_method_info(conn) do
    if Application.get_env(:operately, :app_env) == :prod do
      conn.method <> " "
    else
      IO.ANSI.cyan() <> conn.method <> IO.ANSI.reset() <> " "
    end
  end

  defp create_path_info(conn) do
    conn.request_path <> " "
  end

  defp create_status_info(conn) do
    if Application.get_env(:operately, :app_env) == :prod do
      "HTTP #{Integer.to_string(conn.status)}"
    else
      color_status(conn.status)
    end
  end

  defp create_duration_info(duration) do
    if Application.get_env(:operately, :app_env) == :prod do
      "(#{duration}ms)"
    else
      IO.ANSI.yellow() <> "(#{duration}ms)" <> IO.ANSI.reset()
    end
  end

  defp color_status(status) when status >= 200 and status < 300, do: IO.ANSI.green() <> Integer.to_string(status) <> IO.ANSI.reset()
  defp color_status(status) when status >= 300 and status < 400, do: IO.ANSI.cyan() <> Integer.to_string(status) <> IO.ANSI.reset()
  defp color_status(status) when status >= 400 and status < 500, do: IO.ANSI.yellow() <> Integer.to_string(status) <> IO.ANSI.reset()
  defp color_status(status) when status >= 500, do: IO.ANSI.red() <> Integer.to_string(status) <> IO.ANSI.reset()
  defp color_status(status), do: Integer.to_string(status)
end
