defmodule TurboConnect.TsGen.Mutations do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate_mutations(mutations) do
    Enum.map_join(mutations, "\n", fn {name, mutation} -> generate({name, mutation}) end)
  end

  def generate({name, %{inputs: inputs, outputs: outputs}}) do
    """
    #{ts_interface(Atom.to_string(name) <> "_input", inputs.fields)}
    #{ts_interface(Atom.to_string(name) <> "_result", outputs.fields)}
    #{mutation_fn(name)}
    #{mutation_hook(name)}
    """
  end

  def mutation_fn(name) do
    """
    export function #{ts_function_name(name)}(input: #{ts_type(name)}Input): Promise<#{ts_type(name)}Result> {
      return axios.post('/api/#{name}', input).then(({ data }) => data);
    }
    """
  end

  def mutation_hook(name) do
    """
    export function use#{ts_type(name)}() : UseMutationHookResult<#{ts_type(name)}Input, #{ts_type(name)}Result> {
      return useMutation<#{ts_type(name)}Input, #{ts_type(name)}Result>(#{ts_function_name(name)});
    }
    """
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
