defmodule Operately.ParallelTest do
  use ExUnit.Case, async: true

  alias Operately.Parallel

  test "runs concurrently and returns results in input order" do
    owner = self()

    caller =
      Task.async(fn ->
        Parallel.run([
          fn ->
            send(owner, {:first, self()})

            receive do
              :finish -> :first
            end
          end,
          fn ->
            send(owner, :second)
            :second
          end
        ])
      end)

    assert_receive {:first, first}
    assert_receive :second
    send(first, :finish)
    assert Task.await(caller) == [:first, :second]
    assert Parallel.run([]) == []
    assert Parallel.run([fn -> {:error, :domain_error} end]) == [{:error, :domain_error}]
  end

  test "preserves the exception and stack and stops an earlier unfinished sibling" do
    owner = self()
    error = %DBConnection.ConnectionError{reason: :queue_timeout, message: "queue diagnostic"}

    caller =
      Task.async(fn ->
        try do
          Parallel.run([
            fn ->
              send(owner, {:blocked, self()})

              receive do
                :never -> :ok
              end
            end,
            fn ->
              send(owner, {:failing, self()})

              receive do
                :fail -> raise_failure(error)
              end
            end
          ])
        rescue
          failure -> {failure, __STACKTRACE__}
        end
      end)

    assert_receive {:blocked, blocked}
    assert_receive {:failing, failing}
    monitor = Process.monitor(blocked)
    send(failing, :fail)
    assert {^error, stack} = Task.await(caller)
    assert Enum.any?(stack, fn {module, function, _, _} -> module == __MODULE__ and function == :raise_failure end)
    assert_receive {:DOWN, ^monitor, :process, ^blocked, _}
    refute Process.alive?(blocked)
  end

  test "preserves unrelated exceptions, throws and exits without classifying them" do
    assert_raise ArgumentError, fn -> Parallel.run([fn -> raise ArgumentError end]) end
    assert catch_throw(Parallel.run([fn -> throw(:domain_failure) end])) == :domain_failure
    assert catch_exit(Parallel.run([fn -> exit(:unrelated) end])) == :unrelated
    assert catch_exit(Parallel.run([fn -> Process.exit(self(), :kill) end])) == :killed
  end

  test "does not reinterpret exception-shaped exit reasons or successful values" do
    error = %DBConnection.ConnectionError{reason: :queue_timeout, message: "queue diagnostic"}
    reason = {error, []}
    value = {:shutdown, {Parallel, :error, error, []}}

    assert catch_exit(Parallel.run([fn -> exit(reason) end])) == reason
    assert Parallel.run([fn -> value end]) == [value]
  end

  test "task timeout remains an exit and stops all unfinished work" do
    owner = self()

    blocked = fn ->
      send(owner, {:blocked, self()})

      receive do
        :never -> :ok
      end
    end

    assert catch_exit(Parallel.run([blocked, blocked], 50)) == :timeout
    assert_receive {:blocked, first}
    assert_receive {:blocked, second}
    refute Process.alive?(first)
    refute Process.alive?(second)
  end

  @tag capture_log: true
  test "stops children when the caller dies" do
    owner = self()

    {caller, monitor} =
      spawn_monitor(fn ->
        Parallel.run([
          fn ->
            send(owner, {:blocked, self()})

            receive do
              :never -> :ok
            end
          end
        ])
      end)

    assert_receive {:blocked, child}
    child_monitor = Process.monitor(child)
    Process.exit(caller, :kill)
    assert_receive {:DOWN, ^monitor, :process, ^caller, :killed}
    assert_receive {:DOWN, ^child_monitor, :process, ^child, _}
  end

  defp raise_failure(error), do: raise(error)
end
