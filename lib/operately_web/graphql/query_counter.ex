defmodule OperatelyWeb.GraphQL.QueryCounter do
  require Logger

  def init(opts), do: opts

  def call(conn, _) do
    Operately.QueryCounter.reset_counts()

    Plug.Conn.register_before_send(conn, fn conn ->
      counts = Operately.QueryCounter.get_counts()
      total = Enum.sum(Enum.map(counts, fn {_, count} -> count end))

      Logger.info("GraphQL query counts: #{inspect(counts)}")
      Logger.info("GraphQL total queries: #{total}")

      conn
    end)
  end
end
