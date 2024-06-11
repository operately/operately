defmodule TurboConnect.TsGen.Mutations do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate_types(mutations) do
    Enum.map_join(mutations, "\n", fn {name, %{inputs: inputs, outputs: outputs}} ->
      input = ts_interface(Atom.to_string(name) <> "_input", inputs.fields)
      output = ts_interface(Atom.to_string(name) <> "_result", outputs.fields)

      input <> "\n" <> output
    end)
  end

  def generate_class_functions(mutations) do
    Enum.map_join(mutations, "\n", fn {name, _} -> 
      """
        async #{ts_function_name(name)}(input: #{ts_type(name)}Input): Promise<#{ts_type(name)}Result> {
          return axios.post(this.basePath + "/#{name}", input).then(({ data }) => data);
        }
      """
    end)
  end

  def generate_hooks(mutations) do
    Enum.map_join(mutations, "\n", fn {name, _} -> 
      """
      export function use#{ts_type(name)}() : UseMutationHookResult<#{ts_type(name)}Input, #{ts_type(name)}Result> {
        return useMutation<#{ts_type(name)}Input, #{ts_type(name)}Result>((input) => defaultApiClient.#{ts_function_name(name)}(input));
      }
      """
    end)
  end

  def generate_default_exports(mutations) do
    Enum.map_join(mutations, "\n", fn {name, _} -> 
      "#{ts_function_name(name)}: (input: #{ts_type(name)}Input) => defaultApiClient.#{ts_function_name(name)}(input)" <> ",\n" <> "  use#{ts_type(name)},"
    end)
  end

  def define_generic_use_mutation_hook do
    """
    type UseMutationHookResult<InputT, ResultT> = [() => Promise<ResultT>, { data: ResultT | null, loading: boolean, error: Error | null }];

    export function useMutation<InputT, ResultT>(fn: (input: InputT) => Promise<ResultT>) : UseMutationHookResult<InputT, ResultT> {
      const [data, setData] = React.useState<ResultT | null>(null);
      const [loading, setLoading] = React.useState<boolean>(false);
      const [error, setError] = React.useState<Error | null>(null);

      const execute = (input: InputT) => {
        setLoading(true);
        setError(null);

        fn(input).then(setData).catch(setError).finally(() => setLoading(false));
      };

      return [execute, { data, loading, error }];
    }
    """
  end
end
