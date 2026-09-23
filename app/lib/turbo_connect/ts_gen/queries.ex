defmodule TurboConnect.TsGen.Queries do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate_types(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n\n", fn {name, %{inputs: inputs, outputs: outputs}} ->
      input = ts_interface("#{name}_input", inputs.fields)
      output = ts_interface("#{name}_result", outputs.fields)

      input <> "\n" <> output
    end)
  end

  def generate_tanstack_options(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, query} ->
      input_type = ts_type(name) <> "Input"
      fn_name = ts_function_name(name)
      result_type = ts_type(name) <> "Result"
      path = endpoint_path(query)

      """
      export function #{fn_name}QueryKeyPrefix() {
        return buildApiQueryKeyPrefix(defaultApiClient, "#{path}");
      }

      export function #{fn_name}QueryKey(input: #{input_type}) {
        return buildApiQueryKey(defaultApiClient, "#{path}", input);
      }

      export function #{fn_name}QueryOptions(input: #{input_type}) {
        return buildApiQueryOptions<#{input_type}, #{result_type}>(defaultApiClient, "#{path}", input);
      }

      export function #{fn_name}Query(input: #{input_type}) {
        return queryClient.query({
          ...#{fn_name}QueryOptions(input),
          staleTime: Infinity,
        });
      }
      """
    end)
  end

  def generate_default_root_exports(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} ->
      fn_name = ts_function_name(name)

      "  #{fn_name}QueryKeyPrefix,\n  #{fn_name}QueryKey,\n  #{fn_name}QueryOptions,\n  #{fn_name}Query,"
    end)
  end

  def generate_namespace_exports(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {fullname, query} ->
      fn_name = ts_function_name(query.name)
      input_type = ts_type(fullname) <> "Input"
      result_type = ts_type(fullname) <> "Result"
      path = endpoint_path(query)

      """
          #{fn_name}QueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "#{path}"),
          #{fn_name}QueryKey: (input: #{input_type}) => buildApiQueryKey(defaultApiClient, "#{path}", input),
          #{fn_name}QueryOptions: (input: #{input_type}) =>
            buildApiQueryOptions<#{input_type}, #{result_type}>(defaultApiClient, "#{path}", input),
          #{fn_name}Query: (input: #{input_type}) => queryClient.query({
            ...buildApiQueryOptions<#{input_type}, #{result_type}>(defaultApiClient, "#{path}", input),
            staleTime: Infinity,
          }),
      """
    end)
  end

  defp endpoint_path(query) do
    if query.namespace == nil do
      "/#{query.name}"
    else
      "/#{query.namespace}/#{query.name}"
    end
  end
end
