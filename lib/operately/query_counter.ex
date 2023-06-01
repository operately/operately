defmodule Operately.QueryCounter do
  require Logger

  def start_link(_opts) do
    Agent.start_link(fn -> %{} end, name: __MODULE__)
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
      type: :worker,
      restart: :permanent,
      shutdown: 500
    }
  end

  def handle_event([:operately, :repo, :query], _measurements, metadata, _config) do
    Agent.update(__MODULE__, fn state ->
      Map.update(state, metadata.source, 1, &(&1 + 1))
    end)
  end

  def get_counts do
    Agent.get(__MODULE__, fn state ->
      state
      |> Map.to_list()
      |> Enum.sort_by(fn {_, count} -> -count end)
    end)
  end

  def reset_counts do
    Agent.update(__MODULE__, fn _ -> %{} end)
  end
end
