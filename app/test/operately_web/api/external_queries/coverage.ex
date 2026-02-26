defmodule OperatelyWeb.Api.ExternalQueries.Coverage do
  def validate_specs do
    discovered_queries = discovered_queries()
    spec_by_query = get_specs()

    discovered_set = MapSet.new(discovered_queries)
    spec_set = MapSet.new(Map.keys(spec_by_query))

    missing_rows =
      discovered_set
      |> MapSet.difference(spec_set)
      |> Enum.sort()
      |> Enum.map(&%{query_name: &1})

    extra_rows =
      spec_set
      |> MapSet.difference(discovered_set)
      |> Enum.sort()
      |> Enum.map(&%{query_name: &1})

    {valid_rows, invalid_rows} =
      spec_by_query
      |> Enum.sort_by(fn {query_name, _spec} -> query_name end)
      |> Enum.filter(fn {query_name, _spec} -> MapSet.member?(discovered_set, query_name) end)
      |> Enum.reduce({[], []}, fn {query_name, spec}, {valid_acc, invalid_acc} ->
        case validate_spec(spec) do
          :ok ->
            {[%{query_name: query_name, spec: spec} | valid_acc], invalid_acc}

          {:error, reasons} ->
            {valid_acc, [%{query_name: query_name, reasons: reasons} | invalid_acc]}
        end
      end)

    %{
      query_rows: Enum.reverse(valid_rows),
      missing_rows: missing_rows,
      extra_rows: extra_rows,
      invalid_rows: Enum.reverse(invalid_rows)
    }
  end

  def build_query_rows(query_rows) when is_list(query_rows) do
    for %{query_name: query_name, spec: spec} <- query_rows do
      %{
        query_name: query_name,
        setup: spec.setup,
        inputs: Map.get(spec, :inputs, %{}),
        assert_fn: spec.assert
      }
    end
  end

  defp discovered_queries do
    OperatelyWeb.Api.External.__queries__()
    |> Map.keys()
    |> Enum.map(&normalize_query_name/1)
    |> Enum.sort()
  end

  defp get_specs do
    OperatelyWeb.Api.ExternalQueries.Specs.specs()
    |> Enum.map(fn {query_name, spec} -> {normalize_query_name(query_name), spec} end)
    |> Map.new()
  end

  defp normalize_query_name(query_name) when is_binary(query_name), do: query_name
  defp normalize_query_name(query_name), do: to_string(query_name)

  defp validate_spec(spec) do
    reasons =
      []
      |> validate_setup(spec)
      |> validate_inputs(spec)
      |> validate_assert(spec)

    case reasons do
      [] -> :ok
      _ -> {:error, Enum.reverse(reasons)}
    end
  end

  defp validate_setup(reasons, %{setup: setup}) when is_function(setup, 1), do: reasons
  defp validate_setup(reasons, _), do: ["setup must be an arity-1 function" | reasons]

  defp validate_inputs(reasons, %{inputs: inputs}) when is_function(inputs, 1), do: reasons
  defp validate_inputs(reasons, %{inputs: inputs}) when is_map(inputs), do: reasons
  defp validate_inputs(reasons, %{inputs: _}), do: ["inputs must be an arity-1 function or a map" | reasons]
  defp validate_inputs(reasons, _), do: reasons

  defp validate_assert(reasons, %{assert: assert_fn}) when is_function(assert_fn, 2), do: reasons
  defp validate_assert(reasons, _), do: ["assert must be an arity-2 function" | reasons]
end
