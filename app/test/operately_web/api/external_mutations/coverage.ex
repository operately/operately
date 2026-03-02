defmodule OperatelyWeb.Api.ExternalMutations.Coverage do
  def validate_specs do
    discovered_mutations = discovered_mutations()
    spec_by_mutation = get_specs()

    discovered_set = MapSet.new(discovered_mutations)
    spec_set = MapSet.new(Map.keys(spec_by_mutation))

    missing_rows =
      discovered_set
      |> MapSet.difference(spec_set)
      |> Enum.sort()
      |> Enum.map(&%{mutation_name: &1})

    extra_rows =
      spec_set
      |> MapSet.difference(discovered_set)
      |> Enum.sort()
      |> Enum.map(&%{mutation_name: &1})

    {valid_rows, invalid_rows} =
      spec_by_mutation
      |> Enum.sort_by(fn {mutation_name, _spec} -> mutation_name end)
      |> Enum.filter(fn {mutation_name, _spec} -> MapSet.member?(discovered_set, mutation_name) end)
      |> Enum.reduce({[], []}, fn {mutation_name, spec}, {valid_acc, invalid_acc} ->
        case validate_spec(spec) do
          :ok ->
            {[%{mutation_name: mutation_name, spec: spec} | valid_acc], invalid_acc}

          {:error, reasons} ->
            {valid_acc, [%{mutation_name: mutation_name, reasons: reasons} | invalid_acc]}
        end
      end)

    %{
      mutation_rows: Enum.reverse(valid_rows),
      missing_rows: missing_rows,
      extra_rows: extra_rows,
      invalid_rows: Enum.reverse(invalid_rows)
    }
  end

  def build_mutation_rows(mutation_rows) when is_list(mutation_rows) do
    for %{mutation_name: mutation_name, spec: spec} <- mutation_rows do
      %{
        mutation_name: mutation_name,
        setup: spec.setup,
        inputs: Map.get(spec, :inputs),
        assert_fn: spec.assert
      }
    end
  end

  defp discovered_mutations do
    OperatelyWeb.Api.External.__mutations__()
    |> Map.keys()
    |> Enum.map(&normalize_mutation_name/1)
    |> Enum.sort()
  end

  defp get_specs do
    OperatelyWeb.Api.ExternalMutations.Mutations.__spec_modules__()
    |> Enum.map(fn module ->
      mutation_name = module.mutation_name()

      spec = %{
        setup: &module.setup/1,
        assert: &module.assert/2
      }

      spec =
        if function_exported?(module, :inputs, 1) do
          Map.put(spec, :inputs, &module.inputs/1)
        else
          spec
        end

      {normalize_mutation_name(mutation_name), spec}
    end)
    |> Map.new()
  end

  defp normalize_mutation_name(mutation_name) when is_binary(mutation_name), do: mutation_name
  defp normalize_mutation_name(mutation_name), do: to_string(mutation_name)

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
