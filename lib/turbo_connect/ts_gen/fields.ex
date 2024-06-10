defmodule TurboConnect.TsGen.Fields do
  import TurboConnect.TsGen.Types, only: [ts_type: 1]

  def generate(fields) when is_list(fields) do
    Enum.map_join(fields, "\n", &convert_field/1)
  end

  def convert_field({name, type, _opts}) do
    "  #{ts_field_name(name)}: #{ts_type(type)};"
  end

  def ts_field_name(name) do
    result = name |> Atom.to_string() |> Macro.camelize()
    String.downcase(String.at(result, 0)) <> String.slice(result, 1..-1)
  end

end
