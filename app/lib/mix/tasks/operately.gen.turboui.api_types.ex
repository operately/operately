defmodule Mix.Tasks.Operately.Gen.Turboui.ApiTypes do
  use Mix.Task

  import Mix.Operately, only: [generate_file!: 2]

  @shortdoc "Generate TurboUI API type definitions"

  @switches [out_file: :string]
  @default_out_file "../turboui/src/ApiTypes/index.ts"

  def run(args) do
    {opts, _, invalid} = OptionParser.parse(args, strict: @switches)

    case invalid do
      [] ->
        :ok

      _ ->
        invalid_args =
          invalid
          |> Enum.map_join(", ", fn {key, _value} -> "#{key}" end)

        Mix.raise("Unknown option(s): #{invalid_args}")
    end

    out_file = Keyword.get(opts, :out_file, @default_out_file)

    generate_file!(out_file, fn _path ->
      TurboConnect.TsGen.generate_types_only(OperatelyWeb.Api.Internal)
    end)
  end
end
