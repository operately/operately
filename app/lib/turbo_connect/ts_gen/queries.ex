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

  def generate_functions(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {fullname, query} ->
      fn_name = ts_function_name(query.name)
      input_type = ts_type(fullname) <> "Input"
      result_type = ts_type(fullname) <> "Result"

      path =
        if query.namespace == nil do
          "/#{query.name}"
        else
          "/#{query.namespace}/#{query.name}"
        end

      """
        async #{fn_name}(input: #{input_type}, options?: QueryOptions<#{input_type}, #{result_type}>): Promise<#{result_type}> {
          return this.client.get("#{path}", input, options?.cache);
        }
      """
    end)
  end

  def generate_root_namespace_delegators(queries) do
    queries
    |> Enum.filter(fn {_, %{namespace: ns}} -> ns == nil end)
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {fullname, query} ->
      fn_name = ts_function_name(query.name)
      input_type = ts_type(fullname) <> "Input"
      result_type = ts_type(fullname) <> "Result"

      """
        #{fn_name}(input: #{input_type}, options?: QueryOptions<#{input_type}, #{result_type}>): Promise<#{result_type}> {
          return this.apiNamespaceRoot.#{fn_name}(input, options);
        }
      """
    end)
  end

  def generate_hooks(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} ->
      input_type = ts_type(name) <> "Input"
      result_type = ts_type(name) <> "Result"
      fn_name = ts_function_name(name)

      """
      export function use#{ts_type(name)}(input: #{input_type}, options?: QueryOptions<#{input_type}, #{result_type}>) : UseQueryHookResult<#{result_type}> {
        return useQuery<#{result_type}>(() => defaultApiClient.#{fn_name}(input, options));
      }
      """
    end)
  end

  def generate_default_functions(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} ->
      Enum.join(
        [
          "export async function #{ts_function_name(name)}(input: #{ts_type(name)}Input, options?: QueryOptions<#{ts_type(name)}Input, #{ts_type(name)}Result>) : Promise<#{ts_type(name)}Result> {",
          "  return defaultApiClient.#{ts_function_name(name)}(input, options);",
          "}"
        ],
        "\n"
      )
    end)
  end

  def generate_default_root_exports(queries) do
    queries
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} ->
      "  #{ts_function_name(name)},\n  use#{ts_type(name)},"
    end)
  end

  def define_query_cache_helpers do
    """
    type QueryCacheEntry<ResultT> = { data: ResultT; expiresAt: number };

    export type QueryCacheOptions<InputT, ResultT> = {
      ttlMs?: number;
      key?: string;
      serialize?: (input: InputT) => string;
    };

    export type QueryOptions<InputT, ResultT> = {
      cache?: QueryCacheOptions<InputT, ResultT>;
    };
    """
  end

  def define_generic_use_query_hook do
    """
    type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null, refetch: () => void };

    export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
      const [data, setData] = React.useState<ResultT | null>(null);
      const [loading, setLoading] = React.useState<boolean>(true);
      const [error, setError] = React.useState<Error | null>(null);

      const fetchData = React.useCallback(() => {
        setError(null);

        fn().then(setData).catch(setError).finally(() => setLoading(false));
      }, []);

      React.useEffect(() => fetchData(), []);

      const refetch = React.useCallback(() => {
        setLoading(true);
        fetchData();
      }, []);

      return { data, loading, error, refetch };
    }
    """
  end
end
