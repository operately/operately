defmodule TurboConnect.TsGen.Mutations do
  import TurboConnect.TsGen.Typescript, only: [ts_type: 1, ts_interface: 2]

  def generate(mutations) when is_list(mutations) do
    Enum.map_join(mutations, "\n", &generate/1)
  end

  def generate({name, %{inputs: inputs, output: output}}) do
    """
    #{ts_interface(Atom.to_string(name) <> "_input", inputs)}
    #{ts_interface(Atom.to_string(name) <> "_output", output)}

    export function #{ts_type(name)}(input: #{ts_type(name)}Input): Promise<#{ts_type(name)}Output>;
    """
  end
end
