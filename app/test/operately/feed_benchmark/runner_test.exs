defmodule Operately.FeedBenchmark.RunnerTest do
  use ExUnit.Case, async: true
  alias Operately.FeedBenchmark.Runner

  test "measurement includes child queries and detaches handlers after failure" do
    handlers_before = :telemetry.list_handlers([:operately, :repo, :query]) |> Enum.map(& &1.id) |> MapSet.new()

    {result, metrics} =
      Runner.measure(fn ->
        Task.async(fn ->
          :telemetry.execute([:operately, :repo, :query], %{query_time: System.convert_time_unit(2, :millisecond, :native), queue_time: 0}, %{})
          :done
        end)
        |> Task.await()
      end)

    assert result == :done
    assert metrics.query_count == 1
    assert metrics.db_ms == 2.0
    assert metrics.elapsed_ms >= 0
    assert_raise RuntimeError, "measurement failed", fn -> Runner.measure(fn -> raise "measurement failed" end) end
    handlers_after = :telemetry.list_handlers([:operately, :repo, :query]) |> Enum.map(& &1.id) |> MapSet.new()
    assert handlers_before == handlers_after
  end
end
