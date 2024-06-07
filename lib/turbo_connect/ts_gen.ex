defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  @spec generate(module) :: String.t()
  def generate(api_module) do
    %{objects: objects, unions: unions} = api_module.__types__()

    convert_objects(objects) <> "\n\n" <> convert_unions(unions) <> "\n"
  end

  def convert_objects(objects), do: Enum.map_join(objects, "\n\n", &convert_object/1)
  def convert_unions(unions), do: Enum.map_join(unions, "\n\n", &convert_union/1)
  def convert_fields(fields), do: Enum.map_join(fields, "\n", &convert_field/1)

  def convert_object({name, object}) do
    "export interface #{ts_type(name)} {\n#{convert_fields(object.fields)}\n}"
  end

  def convert_field({name, type, _opts}) do
    "  #{ts_field_name(name)}: #{ts_type(type)};"
  end

  def ts_field_name(name) do
    result = name |> Atom.to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1..-1)
  end

  def convert_union({name, types}) do
    "export type #{ts_type(name)} = #{Enum.map_join(types, " | ", &ts_type/1)};"
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
