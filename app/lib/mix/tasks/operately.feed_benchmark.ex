defmodule Mix.Tasks.Operately.FeedBenchmark do
  use Mix.Task
  alias Operately.FeedBenchmark, as: Benchmark
  alias Operately.FeedBenchmark.{Seed, Runner}
  alias Operately.Repo

  @shortdoc "Seed or measure the isolated local activity feed dataset"
  def run([command | args]) when command in ["seed", "run"] do
    opts = Benchmark.options(args)
    if command == "run" and args != [], do: raise(ArgumentError, "run does not accept seed options")
    Mix.Task.run("app.config")
    Benchmark.validate_database!(Mix.env(), Repo.config()[:database], Application.get_env(:operately, :feed_benchmark, false))

    if command == "seed" do
      seed(opts)
    else
      Mix.Task.run("app.start")
      verify_connection!()
      manifest = Benchmark.read_manifest() || raise "Run make benchmark.feed.seed first"
      Seed.validate!(manifest)
      Runner.run(manifest)
    end
  end

  def run(_), do: raise(ArgumentError, "Usage: mix operately.feed_benchmark seed [--activities N] [--reset] | run")

  defp seed(opts) do
    action = Benchmark.seed_action(Benchmark.read_manifest(), opts)
    if action == :reset, do: Mix.Task.run("ecto.drop", ["--force"])
    Mix.Task.run("ecto.create")
    Mix.Task.run("ecto.migrate")
    Mix.Task.run("app.start")
    verify_connection!()

    manifest =
      if action == :reuse do
        manifest = Benchmark.read_manifest()
        Seed.validate!(manifest)
        manifest
      else
        if Repo.aggregate(Operately.Companies.Company, :count) != 0 do
          raise "Benchmark database has data but no matching manifest; rebuild with RESET=true"
        end

        manifest = Seed.generate(%{activities: opts.activities})
        Seed.analyze()
        Benchmark.write_json!(Benchmark.manifest_path(), manifest)
        manifest
      end

    Mix.shell().info("Dataset: #{Benchmark.database()} (#{manifest["activities"]} activities)")
    Mix.shell().info("Company: #{manifest["company_name"]}")
    Mix.shell().info("Run make benchmark.feed.run to measure the feed. No web server is needed.")
  end

  defp verify_connection! do
    %{rows: [[database]]} = Repo.query!("SELECT current_database()")
    Benchmark.validate_database!(Mix.env(), database, Application.get_env(:operately, :feed_benchmark, false))
  end
end
