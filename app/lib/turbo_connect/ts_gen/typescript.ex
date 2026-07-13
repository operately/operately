defmodule TurboConnect.TsGen.Typescript do
  def ts_interface(name, fields, typename \\ nil) do
    [
      "export interface ",
      ts_type(name),
      " {\n",
      ts_interface_fields(fields, typename),
      "\n}\n"
    ]
    |> IO.iodata_to_binary()
  end

  def ts_sum_type(name, types) do
    [
      "export type ",
      ts_type(name),
      " = ",
      Enum.map_join(types, " | ", &ts_type/1),
      ";\n"
    ]
    |> IO.iodata_to_binary()
  end

  def ts_enum(name, values) when length(values) > 0 do
    values_str =
      values
      |> Enum.map(&enum_value_literal/1)
      |> Enum.join(" | ")

    [
      "export type ",
      ts_type(name),
      " = ",
      values_str,
      ";\n"
    ]
    |> IO.iodata_to_binary()
  end

  def ts_type_alias(name, type) do
    [
      "export type ",
      ts_type(name),
      " = ",
      ts_type(type),
      ";\n"
    ]
    |> IO.iodata_to_binary()
  end

  def ts_function_name(name) do
    result = name |> to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1, String.length(result) - 1)
  end

  def ts_interface_fields(fields, typename \\ nil) do
    Enum.map_join(fields, "\n", fn field -> ts_interface_field(field, typename) end)
  end

  def ts_interface_field({name, type, opts}, typename) do
    if name == :__typename and is_binary(typename) do
      "  __typename?: " <> inspect(typename) <> ";"
    else
      optional = Keyword.get(opts, :optional, true)
      null = Keyword.get(opts, :null, true)
      null_option = if(null, do: " | null", else: "")

      "  " <> ts_field_name(name, optional) <> ": " <> ts_type(type) <> null_option <> ";"
    end
  end

  defp enum_value_literal(v) when is_integer(v), do: to_string(v)
  defp enum_value_literal(v) when is_atom(v), do: inspect(Atom.to_string(v))
  defp enum_value_literal(v), do: inspect(to_string(v))

  defp ts_field_name(:__typename, _optional), do: "__typename"

  defp ts_field_name(name, optional) do
    result = name |> Atom.to_string() |> Macro.camelize()
    camel = String.downcase(String.at(result, 0)) <> String.slice(result, 1, String.length(result) - 1)

    if optional, do: camel <> "?", else: camel
  end

  def ts_type(type) do
    case type do
      {:list, inner} -> ts_type(inner) <> "[]"
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
