defmodule Operately.Mcp.RateLimit do
  @moduledoc """
  Per-instance fixed-window rate limiting for MCP OAuth, CIMD fetch, and tools/call.

  Uses a public ETS table. It should be replaced with a solution such as Redis when
  cluster-wide limits are needed.
  """

  @table :operately_mcp_rate_limit

  @doc """
  Checks all configured buckets for `action`. Returns `:ok` or `{:error, retry_after_seconds}`.

  Keyword values identify bucket dimensions (e.g. `ip: "1.2.3.4"`, `client_id: "..."`).
  Blank values skip optional buckets (e.g. missing `client_id` on token requests).
  """
  def check(action, opts) when is_atom(action) and is_list(opts) do
    if enabled?() do
      config = bucket_config(action)
      check_buckets(action, config, opts)
    else
      :ok
    end
  end

  @doc """
  Formats `conn.remote_ip` (or any `:inet.ip_address()`) for use as a rate-limit key.
  """
  def format_ip(nil), do: nil

  def format_ip(ip) when is_tuple(ip) do
    ip
    |> :inet.ntoa()
    |> to_string()
  end

  def clear do
    ensure_table()
    :ets.delete_all_objects(@table)
    :ok
  end

  defp enabled? do
    Application.get_env(:operately, :mcp_rate_limits_enabled, true)
  end

  defp bucket_config(action) do
    :operately
    |> Application.fetch_env!(:mcp_rate_limits)
    |> Map.fetch!(action)
  end

  defp check_buckets(action, %{limit: limit, period_seconds: period_seconds, keys: keys}, opts) do
    # Every configured key must pass (e.g. oauth_token checks both IP and client_id).
    Enum.reduce_while(keys, :ok, fn key, _acc ->
      case bucket_value(opts, key) do
        # Optional dimensions (e.g. missing client_id) are not rate-limited.
        nil ->
          {:cont, :ok}

        value ->
          bucket_key = build_bucket_key(action, key, value)

          case allow(bucket_key, limit, period_seconds) do
            :ok -> {:cont, :ok}
            {:error, _} = error -> {:halt, error}
          end
      end
    end)
  end

  defp bucket_value(opts, :ip), do: present_value(Keyword.get(opts, :ip))
  defp bucket_value(opts, :client_id), do: present_value(Keyword.get(opts, :client_id))
  defp bucket_value(opts, :grant_id), do: present_value(Keyword.get(opts, :grant_id))

  defp present_value(value) when is_binary(value) do
    if String.trim(value) == "", do: nil, else: value
  end

  defp present_value(_), do: nil

  defp build_bucket_key(action, dimension, value) do
    # Prefix with action so oauth_token and oauth_authorize do not share counters.
    "#{action}:#{dimension}:#{value}"
  end

  defp allow(bucket_key, limit, period_seconds) do
    ensure_table()
    now = now()

    case :ets.lookup(@table, bucket_key) do
      [{^bucket_key, window_start, count}] when now - window_start < period_seconds ->
        # Fixed window: reject when count reaches limit, otherwise increment in place.
        if count >= limit do
          {:error, retry_after(window_start, period_seconds, now)}
        else
          :ets.insert(@table, {bucket_key, window_start, count + 1})
          :ok
        end

      _ ->
        # New or expired window — start counting from 1.
        :ets.insert(@table, {bucket_key, now, 1})
        :ok
    end
  end

  defp retry_after(window_start, period_seconds, now) do
    max(period_seconds - (now - window_start), 1)
  end

  defp ensure_table do
    # Lazy-init; public so any process on this node can check/increment counters.
    case :ets.info(@table) do
      :undefined ->
        :ets.new(@table, [:named_table, :public, read_concurrency: true, write_concurrency: true])

      _ ->
        :ok
    end
  end

  defp now, do: System.system_time(:second)
end
