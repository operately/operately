defmodule Operately.Mcp.RateLimit do
  @moduledoc """
  Per-instance fixed-window rate limiting for MCP OAuth, CIMD fetch, and tools/call.

  Uses an ETS table owned by this supervised process. It should be replaced with
  a solution such as Redis when cluster-wide limits are needed.
  """

  use GenServer

  @table :operately_mcp_rate_limit
  @prune_interval_ms :timer.minutes(5)

  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl GenServer
  def init(_opts) do
    :ets.new(@table, [:named_table, :protected, read_concurrency: true])
    schedule_prune()

    {:ok, %{}}
  end

  @doc """
  Checks all configured buckets for `action`. Returns `:ok` or `{:error, retry_after_seconds}`.

  Keyword values identify bucket dimensions (e.g. `ip: "1.2.3.4"`, `client_id: "..."`).
  Blank values skip optional buckets (e.g. missing `client_id` on token requests).
  """
  def check(action, opts) when is_atom(action) and is_list(opts) do
    if enabled?() do
      config = bucket_config(action)
      bucket_keys = bucket_keys(action, config, opts)

      if bucket_keys == [] do
        :ok
      else
        GenServer.call(__MODULE__, {:check, bucket_keys, config.limit, config.period_seconds})
      end
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
    GenServer.call(__MODULE__, :clear)
  end

  @impl GenServer
  def handle_call({:check, bucket_keys, limit, period_seconds}, _from, state) do
    now = now()

    result =
      case rejected_bucket(bucket_keys, limit, period_seconds, now) do
        {:error, _retry_after} = error ->
          error

        :ok ->
          increment_buckets(bucket_keys, period_seconds, now)
          :ok
      end

    {:reply, result, state}
  end

  def handle_call(:clear, _from, state) do
    :ets.delete_all_objects(@table)

    {:reply, :ok, state}
  end

  @impl GenServer
  def handle_info(:prune_expired, state) do
    prune_expired()
    schedule_prune()

    {:noreply, state}
  end

  defp enabled? do
    Application.get_env(:operately, :mcp_rate_limits_enabled, true)
  end

  defp bucket_config(action) do
    :operately
    |> Application.fetch_env!(:mcp_rate_limits)
    |> Map.fetch!(action)
  end

  defp bucket_keys(action, %{keys: keys}, opts) do
    keys
    |> Enum.flat_map(fn key ->
      case bucket_value(opts, key) do
        # Optional dimensions (e.g. missing client_id) are not rate-limited.
        nil -> []
        value -> [build_bucket_key(action, key, value)]
      end
    end)
    |> Enum.uniq()
  end

  defp rejected_bucket(bucket_keys, limit, period_seconds, now) do
    Enum.reduce_while(bucket_keys, :ok, fn bucket_key, _acc ->
      case current_bucket(bucket_key, period_seconds, now) do
        {:current, window_start, count} when count >= limit ->
          {:halt, {:error, retry_after(window_start, period_seconds, now)}}

        _ ->
          {:cont, :ok}
      end
    end)
  end

  defp increment_buckets(bucket_keys, period_seconds, now) do
    Enum.each(bucket_keys, fn bucket_key ->
      case current_bucket(bucket_key, period_seconds, now) do
        {:current, window_start, count} ->
          insert_bucket(bucket_key, window_start, count + 1, period_seconds)

        :expired_or_missing ->
          insert_bucket(bucket_key, now, 1, period_seconds)
      end
    end)
  end

  defp current_bucket(bucket_key, period_seconds, now) do
    case :ets.lookup(@table, bucket_key) do
      [{^bucket_key, window_start, count, _expires_at}] when now - window_start < period_seconds ->
        {:current, window_start, count}

      _ ->
        :expired_or_missing
    end
  end

  defp insert_bucket(bucket_key, window_start, count, period_seconds) do
    :ets.insert(@table, {bucket_key, window_start, count, window_start + period_seconds})
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

  defp retry_after(window_start, period_seconds, now) do
    max(period_seconds - (now - window_start), 1)
  end

  defp prune_expired do
    now = now()

    :ets.select_delete(@table, [
      {{:"$1", :"$2", :"$3", :"$4"}, [{:<, :"$4", now}], [true]}
    ])
  end

  defp schedule_prune, do: Process.send_after(self(), :prune_expired, @prune_interval_ms)

  defp now, do: System.system_time(:second)
end
