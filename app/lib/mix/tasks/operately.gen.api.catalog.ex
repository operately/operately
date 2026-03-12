defmodule Mix.Tasks.Operately.Gen.Api.Catalog do
  use Mix.Task

  alias Operately.ApiDocs.Generator

  @shortdoc "Generate external API catalog JSON for docs and CLI"

  @switches [out_dir: :string, cli_catalog_path: :string]
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
    cli_catalog_path = Keyword.get(opts, :cli_catalog_path)

    generator_opts =
      [out_dir: out_dir]
      |> maybe_put_cli_catalog_path(cli_catalog_path)

    result = Generator.generate_catalog(generator_opts)

    Mix.shell().info("Generated API catalog from OperatelyWeb.Api.External")
    Mix.shell().info("  docs catalog: #{result.catalog_path}")
    Mix.shell().info("  cli catalog: #{result.cli_catalog_path}")
    Mix.shell().info("  endpoints: #{result.endpoint_count} (queries: #{result.query_count}, mutations: #{result.mutation_count})")
  end

  defp maybe_put_cli_catalog_path(opts, nil), do: opts
  defp maybe_put_cli_catalog_path(opts, cli_catalog_path), do: Keyword.put(opts, :cli_catalog_path, cli_catalog_path)
end
