defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  def generate(specs) do
    interfaces = generate_object_interfaces(specs.objects)
    unions = generate_union_types(specs.unions)

    interfaces <> "\n\n" <> unions <> "\n"
  end

  defp generate_union_types(unions) do
    unions
    |> Enum.map(&generate_union_type/1)
    |> Enum.join("\n")
  end

  defp generate_union_type({name, types}) do
    types_code = Enum.map(types, &to_js_type/1)
    types_code = Enum.join(types_code, " | ")

    "export type #{to_js_type(name)} = #{types_code};"
  end

  defp generate_object_interfaces(objects) do
    objects
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map(&generate_object/1)
    |> Enum.join("\n\n")
  end

  defp generate_object({name, object}) do
    fields = object.fields
    fields_code = Enum.map(fields, &generate_field/1)
    fields_code = Enum.join(fields_code, "\n") |> indent(2)

    "export interface #{to_js_type(name)} {\n#{fields_code}\n}"
  end

  defp generate_field(field) do
    "#{ts_field_name(field.name)}: #{to_js_type(field.type)};"
  end

  def to_js_type(type) do
    case type do
      {:list, type} -> "#{to_js_type(type)}[]"
      {:one_of, types} -> types |> Enum.map(&to_js_type/1) |> Enum.join(" | ")

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

  def ts_field_name(name) do
    result = name |> Atom.to_string() |> Macro.camelize()

    String.downcase(String.at(result, 0)) <> String.slice(result, 1..-1)
  end

  def indent(str, n) do
    str
    |> String.split("\n")
    |> Enum.map(&"#{String.duplicate(" ", n)}#{&1}")
    |> Enum.join("\n")
  end
end
