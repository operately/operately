defmodule Operately.FeedBenchmark do
  @moduledoc "Local-only activity feed reproduction utilities."
  @database "operately_feed_benchmark"
  @version 3

  def database, do: @database
  def version, do: @version
  def output_root, do: Path.expand("../../../tmp/feed-benchmark", __DIR__)
  def manifest_path, do: Path.join(output_root(), "dataset.json")

  def validate_database!(:dev, @database, true), do: :ok
  def validate_database!(_, _, _), do: raise(ArgumentError, "Feed benchmark requires dev mode, OPERATELY_FEED_BENCHMARK=true, and database #{@database}")

  def options(args) do
    {opts, rest, invalid} = OptionParser.parse(args, strict: [activities: :integer, reset: :boolean])
    count = Keyword.get(opts, :activities, 20_000)

    if rest != [] or invalid != [] or count < 1 do
      raise ArgumentError, "Expected --activities POSITIVE_INTEGER and optional --reset"
    end

    %{activities: count, reset: Keyword.get(opts, :reset, false)}
  end

  def seed_action(_, %{reset: true}), do: :reset
  def seed_action(nil, _), do: :create
  def seed_action(%{"version" => @version, "activities" => count}, %{activities: count}), do: :reuse
  def seed_action(_, _), do: raise(ArgumentError, "Dataset parameters/version differ; rebuild with RESET=true")

  def actions do
    Path.expand("../../assets/js/features/activities/index.tsx", __DIR__)
    |> File.read!()
    |> parse_actions!()
  end

  def parse_actions!(source) do
    with [_, body] <- Regex.run(~r/export const DISPLAYED_IN_FEED\s*=\s*\[([^\]]*)\];/s, source),
         true <- Regex.match?(~r/\A\s*(?:"[a-z_]+"\s*,?\s*)+\z/, body) do
      Regex.scan(~r/"([a-z_]+)"/, body) |> Enum.map(&List.last/1)
    else
      _ -> raise ArgumentError, "Cannot parse the literal DISPLAYED_IN_FEED action list"
    end
  end

  def read_manifest do
    case File.read(manifest_path()) do
      {:ok, data} -> Jason.decode!(data)
      {:error, :enoent} -> nil
      {:error, reason} -> raise File.Error, reason: reason, action: "read", path: manifest_path()
    end
  end

  def write_json!(path, data) do
    File.mkdir_p!(Path.dirname(path))
    temporary = path <> ".tmp"
    File.write!(temporary, Jason.encode!(data, pretty: true))
    File.rename!(temporary, path)
  end

  def plan_nodes(%{"Plan" => plan}), do: plan_nodes(plan)
  def plan_nodes(plan), do: [Map.delete(plan, "Plans") | Enum.flat_map(Map.get(plan, "Plans", []), &plan_nodes/1)]

  def pathological_plan?(plan) do
    nodes = plan_nodes(plan)

    Enum.any?(nodes, &(Map.get(&1, "Rows Removed by Join Filter", 0) >= 1_000_000)) and
      Enum.any?(nodes, &(&1["Node Type"] == "Materialize" and Map.get(&1, "Actual Loops", 0) >= 100 and Map.get(&1, "Temp Read Blocks", 0) > 0))
  end
end
