defmodule OperatelyWeb.Graphql.QueryCounter do
  require Logger

  def init(opts), do: opts

  def call(conn, _) do
    if enabled?() do
      count_queries(conn)
    else
      conn
    end
  end

  defp count_queries(conn) do
    Operately.QueryCounter.reset_counts()

    Plug.Conn.register_before_send(conn, fn conn ->
      counts = Operately.QueryCounter.get_counts()
      total = Enum.sum(Enum.map(counts, fn {_, count} -> count end))

      Logger.info("Graphql query counts: #{inspect(counts)}")
      Logger.info("Graphql total queries: #{total}")

      conn
    end)
  end

  defp enabled?() do
    Application.get_env(:operately, :start_query_counter)
  end
end
