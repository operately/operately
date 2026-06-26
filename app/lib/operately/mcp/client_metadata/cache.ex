defmodule Operately.Mcp.ClientMetadata.Cache do
  @table :operately_mcp_cimd_cache

  @doc """
  Returns a cached document when present and not expired.
  """
  def get(url) when is_binary(url) do
    ensure_table()

    case :ets.lookup(@table, url) do
      [{^url, document, expires_at}] ->
        if expires_at > now(), do: {:ok, document}, else: :miss

      _ ->
        :miss
    end
  end

  @doc """
  Stores a document for the given TTL in seconds.

  Non-positive TTLs are ignored so dead entries are not kept in ETS.
  """
  def put(url, document, ttl_seconds) when is_binary(url) and is_map(document) and is_integer(ttl_seconds) do
    if ttl_seconds > 0 do
      ensure_table()
      :ets.insert(@table, {url, document, now() + ttl_seconds})
    end

    :ok
  end

  def clear do
    ensure_table()
    :ets.delete_all_objects(@table)
    :ok
  end

  defp ensure_table do
    case :ets.info(@table) do
      :undefined ->
        :ets.new(@table, [:named_table, :public, read_concurrency: true])

      _ ->
        :ok
    end
  end

  defp now, do: System.system_time(:second)
end
