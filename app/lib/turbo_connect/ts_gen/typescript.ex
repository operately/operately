defmodule TurboConnect.TsGen.Typescript do
  def ts_interface(name, fields) do
    """
    export interface #{ts_type(name)} {
    #{ts_interface_fields(fields)}
    }
    """
  end

  def ts_sum_type(name, types) do
    """
    export type #{ts_type(name)} = #{Enum.map_join(types, " | ", &ts_type/1)};
    """
  end

  def ts_enum(name, values) when length(values) > 0 do
    values = Enum.map(values, fn v -> "\"#{Atom.to_string(v)}\"" end) |> Enum.join(" | ")

    """
    export type #{ts_type(name)} = #{values};
    """
  end

  def ts_type_alias(name, type) do
    """
    export type #{ts_type(name)} = #{ts_type(type)};
    """
  end

  def ts_function_name(name) do
    result = name |> to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1, String.length(result) - 1)
  end

  def ts_interface_fields(fields) do
    Enum.map_join(fields, "\n", fn {name, type, opts} -> ts_interface_field({name, type, opts}) end)
  end

  def ts_interface_field({name, type, opts}) do
    optional = Keyword.get(opts, :optional, true)
    nullable = Keyword.get(opts, :nullable, true)

    null_option = if nullable, do: " | null", else: ""

    "  #{ts_field_name(name, optional)}: #{ts_type(type)}#{null_option};"
  end

  defp ts_field_name(name, optional) do
    result = name |> Atom.to_string() |> Macro.camelize()
    name = String.downcase(String.at(result, 0)) <> String.slice(result, 1, String.length(result) - 1)

    if optional do
      "#{name}?"
    else
      name
    end
  end

  def ts_type(type) do
    case type do
      {:list, type} -> ts_type(type) <> "[]"
      :string -> "string"
      :integer -> "number"
      :float -> "number"
      :boolean -> "boolean"
      :date -> "string"
      :time -> "string"
      :datetime -> "string"
      type when is_atom(type) -> type |> Atom.to_string() |> String.replace("/", "_") |> Macro.camelize()
      type when is_binary(type) -> type |> String.replace("/", "_") |> Macro.camelize()
      _ -> raise ArgumentError, "Unknown type: #{inspect(type)}"
    end
  end
end
