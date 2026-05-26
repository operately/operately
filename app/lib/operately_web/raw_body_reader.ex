defmodule OperatelyWeb.RawBodyReader do
  def read_body(conn, opts) do
    if conn.request_path == "/webhooks/polar" do
      do_read_body(conn, opts, [])
    else
      Plug.Conn.read_body(conn, opts)
    end
  end

  defp do_read_body(conn, opts, acc) do
    case Plug.Conn.read_body(conn, opts) do
      {:ok, body, conn} ->
        raw_body = IO.iodata_to_binary([acc, body])
        # Store the exact bytes Polar signed so verification does not depend on JSON re-encoding.
        {:ok, raw_body, Plug.Conn.put_private(conn, :raw_body, raw_body)}

      {:more, body, conn} ->
        do_read_body(conn, opts, [acc, body])
    end
  end
end
