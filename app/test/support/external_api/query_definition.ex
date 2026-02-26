defmodule Operately.Support.ExternalApi.QueryDefinition do
  defmacro __using__(_) do
    quote do
      import unquote(__MODULE__)

      Module.register_attribute(__MODULE__, :external_query_specs, accumulate: true)
      @before_compile unquote(__MODULE__)
    end
  end

  defmacro query(name, do: block) do
    quote do
      @external_query_specs {to_string(unquote(name)), unquote(build_spec(block))}
    end
  end

  defmacro __before_compile__(_env) do
    quote do
      def __external_query_spec_module__, do: true

      def specs do
        @external_query_specs
        |> Enum.reverse()
        |> Enum.into(%{})
      end
    end
  end

  defp build_spec(block) do
    entries =
      block
      |> normalize_block()
      |> Enum.map(&parse_entry/1)

    ensure_required!(entries, :setup)
    ensure_required!(entries, :assert)

    entries
    |> Enum.reduce([], &put_unique_entry/2)
    |> Enum.reverse()
    |> to_spec_ast()
  end

  defp normalize_block({:__block__, _, entries}), do: entries
  defp normalize_block(entry), do: [entry]

  defp parse_entry({key, _, [value]}) when key in [:setup, :inputs, :assert] do
    {key, qualify_function_capture(value)}
  end

  defp parse_entry(entry) do
    raise ArgumentError,
          "Invalid query spec entry: #{Macro.to_string(entry)}. Allowed entries are setup, inputs, and assert."
  end

  defp ensure_required!(entries, key) do
    if Enum.any?(entries, fn {entry_key, _} -> entry_key == key end) do
      :ok
    else
      raise ArgumentError, "Missing required entry `#{key}` in query spec."
    end
  end

  defp put_unique_entry({key, value}, acc) when is_list(acc) do
    if Keyword.has_key?(acc, key) do
      raise ArgumentError, "Duplicate `#{key}` entry in query spec."
    end

    [{key, value} | acc]
  end

  defp qualify_function_capture({:&, meta, [{:/, _, [{name, _, nil}, arity]}]}) do
    {:&, meta, [{:/, [], [{{:., [], [{:__MODULE__, [], Elixir}, name]}, [], []}, arity]}]}
  end

  defp qualify_function_capture(value), do: value

  defp to_spec_ast(entries) when is_list(entries) do
    pairs = Enum.map(entries, fn {key, value} -> {key, value} end)
    {:%{}, [], pairs}
  end
end
