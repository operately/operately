defmodule Operately.ProductReleases.Cache do
  @moduledoc """
  In-memory cache for the latest product release. The ETS table is owned by this
  supervised process so it is not tied to a request process.
  """

  use GenServer

  @table :operately_product_releases_cache
  @key :latest
  @ttl_seconds 3_600

  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def get do
    case :ets.lookup(@table, @key) do
      [{@key, release, expires_at}] ->
        if expires_at > now(), do: {:fresh, release}, else: {:expired, release}

      [] ->
        :miss
    end
  end

  def put(release, ttl_seconds \\ @ttl_seconds) do
    GenServer.call(__MODULE__, {:put, release, ttl_seconds})
  end

  def clear do
    GenServer.call(__MODULE__, :clear)
  end

  @impl GenServer
  def init(_opts) do
    :ets.new(@table, [:named_table, :protected, read_concurrency: true])
    {:ok, %{}}
  end

  @impl GenServer
  def handle_call({:put, release, ttl_seconds}, _from, state) do
    :ets.insert(@table, {@key, release, now() + ttl_seconds})
    {:reply, :ok, state}
  end

  def handle_call(:clear, _from, state) do
    :ets.delete_all_objects(@table)
    {:reply, :ok, state}
  end

  defp now, do: System.system_time(:second)
end
