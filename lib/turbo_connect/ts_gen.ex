defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  @spec generate(module) :: String.t()
  def generate(api_module) do
    """
    import React from "react";
    import axios from "axios";

    #{convert_objects(api_module.__types__().objects)}
    #{convert_unions(api_module.__types__().unions)}
    #{define_generic_use_query_hook()}
    #{convert_queries(api_module.__queries__())}
    """
  end

  def convert_objects(objects), do: Enum.map_join(objects, "\n", &convert_object/1)
  def convert_unions(unions), do: Enum.map_join(unions, "\n", &convert_union/1)
  def convert_fields(fields), do: Enum.map_join(fields, "\n", &convert_field/1)
  def convert_queries(queries), do: Enum.map_join(queries, "", &convert_query/1)

  def convert_object({name, object}) do
    """
    export interface #{ts_type(name)} {
    #{convert_fields(object.fields)}
    }
    """
  end

  def convert_field({name, type, _opts}) do
    "  #{ts_field_name(name)}: #{ts_type(type)};"
  end

  def convert_union({name, types}) do
    """
    export type #{ts_type(name)} = #{Enum.map_join(types, " | ", &ts_type/1)};
    """
  end

  def convert_query(query) do
    """
    #{query_input_types(query)}
    #{query_output_types(query)}
    #{query_fn(query)}
    #{query_hook(query)}
    """
    |> String.trim()
  end

  def query_input_types({name, %{inputs: inputs}}) do
    """
    export interface #{ts_type(name)}Input {
    #{convert_fields(inputs.fields)}
    }
    """
  end

  def query_output_types({name, %{outputs: outputs}}) do
    """
    export interface #{ts_type(name)}Result {
    #{convert_fields(outputs.fields)}
    }
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

  def ts_function_name(name) do
    result = name |> Atom.to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1..-1)
  end

  def ts_field_name(name) do
    result = name |> Atom.to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1..-1)
  end

  def ts_type(type) do
    case type do
      {:list, type} -> ts_type(type) <> "[]"

      :string -> "string"
      :integer -> "number"
      :float -> "number"
      :boolean -> "boolean"
      :date -> "Date"
      :time -> "Date"
      :datetime -> "Date"

      type when is_atom(type) -> Macro.camelize(Atom.to_string(type))

      _ -> raise ArgumentError, "Unknown type: #{inspect(type)}"
    end
  end
end
