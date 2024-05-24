defmodule CustomFormatter do
  use GenServer

  def start_link(_) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def init(_) do
    {:ok, []}
  end

  def handle_cast({:suite_started, _}, state), do: {:noreply, state}
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

  defp display_module_started(mod, state) do
    name = String.replace(Atom.to_string(mod.name), "Elixir.", "")
    IO.puts("\n#{blue(name)}")

    {:noreply, state}
  end

  defp display_test_started(%ExUnit.Test{state: {:excluded, _}}, state) do
    {:noreply, state}
  end

  defp display_test_started(%ExUnit.Test{name: name}, state) do
    [type | rest] = String.split(Atom.to_string(name), " ")

    case type do
      "test" -> IO.write("\n  #{blue("Test")}: #{Enum.join(rest, " ")}")
      "feature" -> IO.write("\n  #{blue("Feature")}: #{Enum.join(rest, " ")}")
    end
    
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: {:excluded, _}}, state) do
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: nil}, state) do
    IO.puts("\n\n    #{green("PASSED")}")
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: {:failed, _}}, state) do
    IO.puts("\n\n    #{red("FAILED")}")
    {:noreply, state}
  end

  defp display_suite_finished(state) do
    IO.puts("")
    {:stop, :normal, state}
  end

  defp red(text), do: IO.ANSI.red() <> text <> IO.ANSI.reset()
  defp green(text), do: IO.ANSI.green() <> text <> IO.ANSI.reset()
  defp blue(text), do: IO.ANSI.blue() <> text <> IO.ANSI.reset()

end
