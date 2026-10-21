defmodule Operately.Parallel do
  @moduledoc """
  Runs a finite group of functions concurrently, preserving input order.

  Workers are unlinked from the caller. Failures retain their original kind and
  stack, and unfinished workers are stopped before the failure leaves this module.
  """

  @spec run([(-> term())], timeout()) :: [term()]
  def run(functions, timeout \\ 5_000) do
    # Tie the supervisor to this caller so abandoned requests cannot leave workers.
    {:ok, supervisor} = Task.Supervisor.start_link()

    try do
      functions
      |> Enum.map(fn function ->
        Task.Supervisor.async_nolink(supervisor, fn -> invoke(function) end, shutdown: :brutal_kill)
      end)
      |> Task.await_many(timeout)
    catch
      :exit, {{:shutdown, {__MODULE__, kind, reason, stack}}, {Task, :await_many, _}} ->
        :erlang.raise(kind, reason, stack)

      :exit, {reason, {Task, :await_many, _}} ->
        exit(reason)
    after
      Supervisor.stop(supervisor)
    end
  end

  defp invoke(function) do
    function.()
  catch
    # A tagged shutdown makes await_many fail immediately without logging the
    # exception twice or confusing a deliberate exit with a raised exception.
    kind, reason -> exit({:shutdown, {__MODULE__, kind, reason, __STACKTRACE__}})
  end
end
