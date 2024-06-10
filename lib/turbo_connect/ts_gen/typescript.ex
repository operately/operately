defmodule TurboConnect.TsGen.Typescript do

  def ts_interface(name, fields) do
    """
    export interface #{ts_type(name)} {
    #{Fields.generate(fields)}
    }
    """
  end

  def ts_sum_type(name, types) do
    """
    export type #{ts_type(name)} = #{Enum.map_join(types, " | ", &ts_type/1)};
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
