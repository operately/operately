defmodule CustomFormatter do
  use GenServer

  def start_link(_) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def init(_) do
    {:ok, []}
  end

  def handle_cast({:suite_started, _}, state), do: {:noreply, state}
  def handle_cast({:suite_finished, _}, state), do: {:noreply, state}

  # deprecated events
  def handle_cast({:case_started, _}, state), do: {:noreply, state}
  def handle_cast({:case_finished, _}, state), do: {:noreply, state}

  # module events
  def handle_cast({:module_started, mod}, state), do: display_module_started(mod, state)
  def handle_cast({:module_finished, _}, state), do: {:noreply, state}
  def handle_cast({:test_started, test}, state), do: display_test_started(test, state)
  def handle_cast({:test_finished, test}, state), do: display_test_finished(test, state)

  def handle_cast({:sigquit, current}, config) do
    IO.puts("CustomFormatter. SIGQUIT: #{inspect(current)}")
    {:noreply, config}
  end

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

  defp display_test_started(%ExUnit.Test{name: _} = test, state) do
    IO.write("\n  #{blue(test_type(test))}: #{test_name(test)} (#{file_and_line(test)})")
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: {:excluded, _}}, state) do
    {:noreply, state}
  end

  defp display_test_finished(%ExUnit.Test{state: nil}, state) do
    IO.puts("\n\n    #{green("PASSED")}")
    {:noreply, state}
  end

  defp display_test_finished(test = %ExUnit.Test{state: {:failed, failures}}, state) do
    IO.puts("\n\n    #{red("FAILED")}")
    IO.puts(ExUnit.Formatter.format_test_failure(test, failures, 0, 80, &formatter(&1, &2, %{colors: colors()})))

    {:noreply, state}
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

  # Color styles

  defp colorize(key, string, %{colors: colors}) do
    if escape = colors[:enabled] && colors[key] do
      [escape, string, :reset]
      |> IO.ANSI.format_fragment(true)
      |> IO.iodata_to_binary()
    else
      string
    end
  end

  defp colorize_doc(escape, doc, %{colors: colors}) do
    if colors[:enabled] do
      Inspect.Algebra.color(doc, escape, %Inspect.Opts{syntax_colors: colors})
    else
      doc
    end
  end

  @default_colors [
    diff_delete: :red,
    diff_delete_whitespace: IO.ANSI.color_background(2, 0, 0),
    diff_insert: :green,
    diff_insert_whitespace: IO.ANSI.color_background(0, 2, 0),

    # CLI formatter
    success: :green,
    invalid: :yellow,
    skipped: :yellow,
    failure: :red,
    error_info: :red,
    extra_info: :cyan,
    location_info: [:bright, :black]
  ]

  defp colors do
    @default_colors |> Keyword.put_new(:enabled, IO.ANSI.enabled?())
  end

  defp formatter(:diff_enabled?, _, %{colors: colors}), do: colors[:enabled]
  defp formatter(:diff_delete, doc, config), do: colorize_doc(:diff_delete, doc, config)
  defp formatter(:diff_delete_whitespace, doc, config), do: colorize_doc(:diff_delete_whitespace, doc, config)
  defp formatter(:diff_insert, doc, config), do: colorize_doc(:diff_insert, doc, config)
  defp formatter(:diff_insert_whitespace, doc, config), do: colorize_doc(:diff_insert_whitespace, doc, config)

  defp formatter(:blame_diff, msg, %{colors: colors} = config) do
    if colors[:enabled] do
      colorize(:diff_delete, msg, config)
    else
      "-" <> msg <> "-"
    end
  end

  defp formatter(key, msg, config), do: colorize(key, msg, config)

  defp pluralize(1, singular, _plural), do: singular
  defp pluralize(_, _singular, plural), do: plural

end
