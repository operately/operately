defmodule TurboConnect.TsGen.Mutations do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2, ts_function_name: 1]

  def generate_types(mutations) do
    mutations
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n\n", fn {name, %{inputs: inputs, outputs: outputs}} ->
      input = ts_interface("#{name}_input", inputs.fields)
      output = ts_interface("#{name}_result", outputs.fields)

      input <> "\n" <> output
    end)
  end

  def generate_functions(mutations) do
    mutations
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {fullname, mutation} ->
      fn_name = ts_function_name(mutation.name)
      input_type = ts_type(fullname) <> "Input"
      result_type = ts_type(fullname) <> "Result"

      path =
        if mutation.namespace == nil do
          "/#{mutation.name}"
        else
          "/#{mutation.namespace}/#{mutation.name}"
        end

      """
        async #{fn_name}(input: #{input_type}): Promise<#{result_type}> {
          return this.client.post("#{path}", input);
        }
      """
    end)
  end

  def generate_root_namespace_delegators(mutations) do
    mutations
    |> Enum.filter(fn {_, %{namespace: ns}} -> ns == nil end)
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {fullname, mutation} ->
      fn_name = ts_function_name(mutation.name)
      input_type = ts_type(fullname) <> "Input"
      result_type = ts_type(fullname) <> "Result"

      """
        #{fn_name}(input: #{input_type}): Promise<#{result_type}> {
          return this.apiNamespaceRoot.#{fn_name}(input);
        }
      """
    end)
  end

  def generate_hooks(mutations) do
    mutations
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _mutation} ->
      """
      export function use#{ts_type(name)}() : UseMutationHookResult<#{ts_type(name)}Input, #{ts_type(name)}Result> {
        return useMutation<#{ts_type(name)}Input, #{ts_type(name)}Result>((input) => defaultApiClient.#{ts_function_name(name)}(input));
      }
      """
    end)
  end

  def generate_default_functions(mutations) do
    mutations
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _mutation} ->
      Enum.join(
        [
          "export async function #{ts_function_name(name)}(input: #{ts_type(name)}Input) : Promise<#{ts_type(name)}Result> {",
          "  return defaultApiClient.#{ts_function_name(name)}(input);",
          "}"
        ],
        "\n"
      )
    end)
  end

  def generate_default_root_exports(mutations) do
    mutations
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, _mutation} ->
      "  #{ts_function_name(name)},\n  use#{ts_type(name)},"
    end)
  end

  def define_generic_use_mutation_hook do
    """
    type UseMutationHookResult<InputT, ResultT> = [
      (input: InputT) => Promise<ResultT | any>,
      { data: ResultT | null, loading: boolean, error: Error | null }
    ];

    export function useMutation<InputT, ResultT>(fn: (input: InputT) => Promise<ResultT>) : UseMutationHookResult<InputT, ResultT> {
      const [data, setData] = React.useState<ResultT | null>(null);
      const [loading, setLoading] = React.useState<boolean>(false);
      const [error, setError] = React.useState<Error | null>(null);

      const execute = async (input: InputT): Promise<ResultT | any> => {
        try {
          setLoading(true);
          setError(null);

          var data = await fn(input);

          setData(data);

          return data;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          setLoading(false);
        }
      };

      return [execute, { data, loading, error }];
    }
    """
  end
end
