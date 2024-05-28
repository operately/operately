defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  def generate(specs) do
    specs.objects
    |> Map.values()
    |> Enum.map(&generate_object/1)
    |> Enum.join("\n\n")
  end

  defp generate_object(object) do
    object_name = object.name
    fields = object.fields
    fields_code = Enum.map(fields, &generate_field/1)
    fields_code = Enum.join(fields_code, ";\n")

    """
    export interface #{String.capitalize(object_name)} {
      #{fields_code};
    }
    """
  end

  defp generate_field(field) do
    field_name = field.name
    field_type = field.type

    """
    #{field_name}: #{String.capitalize(field_type)};
    """
  end
end
