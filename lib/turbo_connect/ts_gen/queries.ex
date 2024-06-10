defmodule TurboConnect.TsGen.Queries do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate(queries) when is_list(queries) do
    Enum.map_join(queries, "\n", &generate/1)
  end

  def generate({name, %{inputs: inputs, output: output}}) do
    """
    #{ts_interface(Atom.to_string(name) <> "_input", inputs)}
    #{ts_interface(Atom.to_string(name) <> "_output", output)}

    #{query_fn(name)}
    """
  end

  def query_fn({name, _}) do
    fn_name = ts_function_name(name)
    input_type = ts_type(name) <> "Input"
    result_type = ts_type(name) <> "Result"

    """
    export async function #{fn_name}(input: #{input_type}): Promise<#{result_type}> {
      return axios.get('/api/#{name}', { params: input }).then(({ data }) => data);
    }
    """
  end

  def query_hook({name, _}) do
    input_type = ts_type(name) <> "Input"
    result_type = ts_type(name) <> "Result"
    fn_name = ts_function_name(name)

    """
    export function use#{ts_type(name)}(input: #{input_type}) : UseQueryHookResult<#{result_type}> {
      return useQuery<#{result_type}>(() => #{fn_name}(input));
    }
    """
  end

  def define_generic_use_query_hook do
    """
    type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null };

    export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
      const [data, setData] = React.useState<ResultT | null>(null);
      const [loading, setLoading] = React.useState<boolean>(false);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        setLoading(true);
        setError(null);

        fn().then(setData).catch(setError).finally(() => setLoading(false));
      }, [fn]);

      return { data, loading, error };
    }
    """
  end
end
