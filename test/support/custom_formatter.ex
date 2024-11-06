defmodule CustomFormatter do
  use GenServer

  def start_link(_) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def init(_) do
    config = %{
      started_at: nil,
      failed_counter: 0,
      passed_counter: 0,
      excluded_counter: 0
    }

    {:ok, config}
  end

  def handle_cast({:suite_started, _}, state), do: {:noreply, Map.put(state, :started_at, System.system_time(:millisecond))}
  def handle_cast({:suite_finished, _}, state), do: display_suite_finished(state)

  # deprecated events
  def handle_cast({:case_started, _}, state), do: {:noreply, state}
  def handle_cast({:case_finished, _}, state), do: {:noreply, state}

  # module events
  def handle_cast({:module_started, mod}, state), do: display_module_started(mod, state)
  def handle_cast({:module_finished, _}, state), do: {:noreply, state}
  def handle_cast({:test_started, test}, state), do: display_test_started(test, state)
  def handle_cast({:test_finished, test}, state), do: display_test_finished(test, state)

  def handle_cast(event, state) do
    IO.puts("CustomFormatter. Unhandler Event: #{inspect(event)}")
    {:noreply, state}
  end

  #
  # Private
  #

  defp display_suite_finished(state) do
    IO.puts("")
    IO.puts("Finished in #{System.system_time(:millisecond) - state.started_at}ms")
    IO.puts("#{state.failed_counter} failed, #{state.excluded_counter} excluded, #{state.passed_counter} passed")
    IO.puts("")

    {:noreply, state}
  end

  defp display_module_started(mod, state) do
    name = String.replace(Atom.to_string(mod.name), "Elixir.", "")
    IO.puts("\n#{blue(name)}")

    {:noreply, state}
  end

  defp display_test_started(%ExUnit.Test{state: {:excluded, _}}, state) do
    {:noreply, state}
  end

  defp display_test_started(%ExUnit.Test{name: _} = test, state) do
    IO.write("\n  #{blue(test_type(test))}: #{test_name(test)} (#{file_and_line(test)})")
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: {:excluded, _}}, state) do
    state = Map.update!(state, :excluded_counter, &(&1 + 1))

    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: nil}, state) do
    IO.puts("\n\n    #{green("PASSED")}")

    state = Map.update!(state, :passed_counter, &(&1 + 1))

    {:noreply, state}
  end

  defp display_test_finished(test = %ExUnit.Test{state: {:failed, failures}}, state) do
    IO.puts("")
    IO.puts(red(format_failure(test, failures)))
    IO.puts("")

    state = Map.update!(state, :failed_counter, &(&1 + 1))

    {:noreply, state}
  end

  defp format_failure(test, failures) do
    formatter_cb = fn key, value -> 
      case key do
        :test_info -> "FAILED"
        :location_info -> ""
        _ -> value
      end
    end

    test
    |> ExUnit.Formatter.format_test_failure(failures, 1, 80, formatter_cb)
    |> String.split("\n")
    |> Enum.map(fn line -> red("    | #{line}") end)
    |> Enum.join("\n")
  end

  defp red(text), do: IO.ANSI.red() <> text <> IO.ANSI.reset()
  defp green(text), do: IO.ANSI.green() <> text <> IO.ANSI.reset()
  defp blue(text), do: IO.ANSI.blue() <> text <> IO.ANSI.reset()

  defp file_and_line(test) do
    {:ok, cwd} = File.cwd()

    file = String.replace(test.tags.file, cwd <> "/", "")
    line = Integer.to_string(test.tags.line)

    "#{file}:#{line}"
  end

  defp test_type(test) do
    test.name
    |> Atom.to_string()
    |> String.split(" ")
    |> hd()
    |> String.capitalize()
  end

  defp test_name(test) do
    test.name
    |> Atom.to_string()
    |> String.split(" ")
    |> tl()
    |> Enum.join(" ")
  end

end
