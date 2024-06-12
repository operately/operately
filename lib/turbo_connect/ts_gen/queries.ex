defmodule TurboConnect.TsGen.Queries do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate_types(queries) do
    queries 
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n\n", fn {name, %{inputs: inputs, outputs: outputs}} ->
      input = ts_interface(Atom.to_string(name) <> "_input", inputs.fields)
      output = ts_interface(Atom.to_string(name) <> "_result", outputs.fields)

      input <> "\n" <> output
    end)
  end

  def generate_class_functions(queries) do
    queries 
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} -> 
      fn_name = ts_function_name(name)
      input_type = ts_type(name) <> "Input"
      result_type = ts_type(name) <> "Result"

      """
        async #{fn_name}(input: #{input_type}): Promise<#{result_type}> {
          return axios.get(this.basePath + "/#{name}", { params: toSnake(input)}).then(({ data }) => toCamel(data));
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
      export function use#{ts_type(name)}(input: #{input_type}) : UseQueryHookResult<#{result_type}> {
        return useQuery<#{result_type}>(() => defaultApiClient.#{fn_name}(input));
      }
      """
    end)
  end

  def generate_default_functions(queries) do
    queries 
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} -> 
      Enum.join([
        "export async function #{ts_function_name(name)}(input: #{ts_type(name)}Input) : Promise<#{ts_type(name)}Result> {",
        "  return defaultApiClient.#{ts_function_name(name)}(input);",
        "}"
      ], "\n")
    end)
  end

  def generate_default_exports(queries) do
    queries 
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _query} -> 
      "  #{ts_function_name(name)},\n  use#{ts_type(name)},"
    end)
  end

  def define_generic_use_query_hook do
    """
    type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null };

    export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
      const [data, setData] = React.useState<ResultT | null>(null);
      const [loading, setLoading] = React.useState<boolean>(true);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        setError(null);

        fn().then(setData).catch(setError).finally(() => setLoading(false));
      }, []);

      return { data, loading, error };
    }
    """
  end
end
