defmodule Mix.Tasks.Operately.Gen.Api.Docs do
  use Mix.Task

  alias Operately.ApiDocs.Generator

  @shortdoc "Generate external API docs for the help center"

  @switches [out_dir: :string]
  @default_out_dir "../tmp/generated/api-docs"

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

    out_dir = Keyword.get(opts, :out_dir, @default_out_dir)
    result = Generator.generate(out_dir: out_dir)

    Mix.shell().info("Generated API docs from OperatelyWeb.Api.External")
    Mix.shell().info("  output: #{result.api_docs_dir}")
    Mix.shell().info("  endpoints: #{result.endpoint_count} (queries: #{result.query_count}, mutations: #{result.mutation_count})")
    Mix.shell().info("")
    Mix.shell().info("Manual copy example:")
    Mix.shell().info("  rm -rf ../operately-website/src/content/docs/help/api")
    Mix.shell().info("  cp -R #{result.api_docs_dir} ../operately-website/src/content/docs/help/api")
  end
end
