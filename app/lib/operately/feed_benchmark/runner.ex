defmodule Operately.FeedBenchmark.Runner do
  @moduledoc false
  import Ecto.Query
  alias Operately.{Repo, FeedBenchmark, Activities}
  alias Operately.FeedBenchmark.Seed
  alias OperatelyWeb.Api.Companies.ListActivities, as: Feed
  alias OperatelyWeb.Api.Serializers.Activity, as: Serializer

  def run(manifest) do
    started = System.monotonic_time(:millisecond)
    directory = Path.join(FeedBenchmark.output_root(), "run-" <> Calendar.strftime(DateTime.utc_now(), "%Y%m%dT%H%M%S") <> "-" <> Integer.to_string(System.unique_integer([:positive])))
    File.mkdir_p!(directory)
    FeedBenchmark.write_json!(Path.join(directory, "environment.json"), environment(manifest))
    company = Repo.get!(Operately.Companies.Company, manifest["company_id"])
    actions = FeedBenchmark.actions()
    old_level = Logger.level()
    Logger.configure(level: :warning)

    try do
      IO.puts("Feed benchmark: #{manifest["activities"]} activities; member/restricted, pages 1 and 10")
      IO.puts("Each sample runs the staged query and the full handler separately. Timings exclude HTTP/browser overhead.")
      IO.puts("The first invocation is reported separately; it does not imply a cold database cache.")

      results =
        for role <- ["member", "restricted"] do
          person = Repo.get!(Operately.People.Person, manifest["people"][role]["id"])
          inputs = %{scope_type: :company, scope_id: OperatelyWeb.Paths.company_id(company), actions: actions, paginate: true}
          first = scenario(person, inputs, role <> "-page-1", directory)
          tenth_inputs = advance(Seed.connection(person), inputs, 9, role)
          tenth = if tenth_inputs, do: scenario(person, tenth_inputs, role <> "-page-10", directory), else: %{status: "fewer_than_10_pages"}
          %{role: role, first_page: first, tenth_page: tenth}
        end

      FeedBenchmark.write_json!(Path.join(directory, "summary.json"), results)
      print_summary(results)
      IO.puts("Total benchmark time: #{System.monotonic_time(:millisecond) - started} ms")
      IO.puts("Benchmark artifacts: #{directory}")
      results
    after
      Logger.configure(level: old_level)
    end
  end

  defp scenario(person, inputs, name, directory) do
    IO.puts("Measuring #{name}...")
    first = sample_with_progress(person, inputs, "First invocation")
    repeated = Enum.map(1..5, fn index -> sample_with_progress(person, inputs, "Repeat #{index}/5") end)
    query = query(person, inputs)
    {sql, params} = Repo.to_sql(:all, query)
    IO.puts("  Capturing text EXPLAIN ANALYZE (executes the query again)...")
    text = Repo.query!("EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS) " <> sql, params, timeout: 120_000)
    File.write!(Path.join(directory, name <> ".txt"), Enum.map_join(text.rows, "\n", &hd/1))
    IO.puts("  Capturing JSON EXPLAIN ANALYZE (executes the query again)...")
    %{rows: [[[plan]]]} = Repo.query!("EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS, FORMAT JSON) " <> sql, params, timeout: 120_000)
    FeedBenchmark.write_json!(Path.join(directory, name <> ".plan.json"), plan)
    reproduced = FeedBenchmark.pathological_plan?(plan)

    summary = %{
      first_invocation: first,
      repeated_runs: repeated,
      aggregate: aggregate(repeated),
      reproduced_pathological_join: reproduced,
      plan_nodes: FeedBenchmark.plan_nodes(plan),
      request: inputs,
      timing_scope: "Endpoint handler excludes HTTP, middleware, and browser overhead"
    }

    FeedBenchmark.write_json!(Path.join(directory, name <> ".json"), summary)
    IO.puts("#{name}: handler median #{summary.aggregate["handler"].median_ms} ms; SQL median #{summary.aggregate["query"].median_ms} ms; pathological join reproduced: #{reproduced}")
    summary
  end

  defp sample_with_progress(person, inputs, label) do
    IO.write("  #{label}: ")
    result = sample(person, inputs)
    IO.puts("SQL #{round(result.stages.query.elapsed_ms)} ms; handler #{round(result.stages.handler.elapsed_ms)} ms; #{length(result.ids)} activities")
    result
  end

  defp print_summary(results) do
    IO.puts("\nRepeated runs (milliseconds; median / maximum)")
    IO.puts(String.pad_trailing("Scenario", 24) <> String.pad_trailing("SQL", 22) <> "Handler")

    for result <- results, {page, key} <- [{1, :first_page}, {10, :tenth_page}] do
      name = String.pad_trailing("#{result.role}-page-#{page}", 24)

      case result[key] do
        %{aggregate: aggregate} ->
          sql = timing_range(aggregate["query"])
          handler = timing_range(aggregate["handler"])
          IO.puts(name <> String.pad_trailing(sql, 22) <> handler)

        %{status: "fewer_than_10_pages"} ->
          IO.puts(name <> "Skipped: fewer than 10 pages")
      end
    end
  end

  defp timing_range(timing), do: "#{Float.round(timing.median_ms, 1)} / #{Float.round(timing.maximum_ms, 1)}"

  def sample(person, inputs) do
    query = query(person, inputs)
    conn = Seed.connection(person)
    {rows, sql} = measure(fn -> Repo.all(query, timeout: 120_000) end)
    {page, associations} = measure(fn -> Repo.preload(Enum.take(rows, 20), [:comment_thread, :author]) end)
    {page, casting} = measure(fn -> Enum.map(page, &Activities.cast_content/1) end)
    {page, preloading} = measure(fn -> Activities.Preloader.preload(page) end)
    {serialized, serialization} = measure(fn -> Serializer.serialize(page) end)
    {{:ok, response}, handler} = measure(fn -> Feed.call(conn, inputs) end)
    ids = Enum.map(serialized, & &1.id)
    if ids != Enum.map(response.activities, & &1.id), do: raise("Staged query and endpoint returned different activities")

    %{
      stages: %{query: sql, associations: associations, casting: casting, preloading: preloading, serialization: serialization, handler: handler},
      ids: ids,
      next_cursor: response.next_cursor
    }
  end

  defp query(person, inputs) do
    cursor =
      case inputs[:cursor] do
        nil ->
          nil

        value ->
          decoded = value |> Base.url_decode64!(padding: false) |> Jason.decode!()
          %{inserted_at: NaiveDateTime.from_iso8601!(decoded["inserted_at"]), id: decoded["id"]}
      end

    Feed.build_query(person, person.company_id, inputs, cursor) |> limit(21)
  end

  defp advance(_conn, inputs, 0, _role), do: inputs

  defp advance(conn, inputs, remaining, role) do
    IO.write("Following #{role} cursor #{10 - remaining}/9 to reach page 10: ")
    {microseconds, response} = :timer.tc(fn -> Feed.call(conn, inputs) end)
    IO.puts("#{round(microseconds / 1000)} ms")

    case response do
      {:ok, %{next_cursor: nil}} -> nil
      {:ok, %{next_cursor: cursor}} -> advance(conn, Map.put(inputs, :cursor, cursor), remaining - 1, role)
      other -> raise "Pagination failed: #{inspect(other)}"
    end
  end

  def measure(fun) do
    {:ok, collector} = Agent.start_link(fn -> %{query_count: 0, db_ms: 0.0, queue_ms: 0.0} end)
    id = {__MODULE__, make_ref()}
    :ok = :telemetry.attach(id, [:operately, :repo, :query], &__MODULE__.record_query/4, {self(), collector})

    try do
      {microseconds, result} = :timer.tc(fun)
      metrics = Agent.get(collector, & &1) |> Map.put(:elapsed_ms, microseconds / 1000)
      {result, metrics}
    after
      :telemetry.detach(id)
      Agent.stop(collector)
    end
  end

  def record_query(_event, measurements, metadata, {owner, collector}) do
    if self() == owner or metadata[:caller] == owner or owner in Process.get(:"$callers", []) do
      Agent.update(collector, fn metrics ->
        %{query_count: metrics.query_count + 1, db_ms: metrics.db_ms + milliseconds(measurements[:query_time]), queue_ms: metrics.queue_ms + milliseconds(measurements[:queue_time])}
      end)
    end
  end

  defp milliseconds(nil), do: 0.0
  defp milliseconds(value), do: System.convert_time_unit(value, :native, :microsecond) / 1000

  defp aggregate(samples) do
    Map.new(~w(query associations casting preloading serialization handler), fn stage ->
      times = samples |> Enum.map(&get_in(&1, [:stages, String.to_existing_atom(stage), :elapsed_ms])) |> Enum.sort()
      {stage, %{median_ms: Enum.at(times, div(length(times), 2)), maximum_ms: List.last(times)}}
    end)
  end

  defp environment(manifest) do
    %{rows: [[version]]} = Repo.query!("SELECT version()")

    %{rows: settings} =
      Repo.query!(
        "SELECT name, setting, unit FROM pg_settings WHERE name IN ('work_mem', 'shared_buffers', 'effective_cache_size', 'random_page_cost', 'seq_page_cost', 'default_statistics_target', 'enable_nestloop', 'enable_hashjoin', 'enable_mergejoin', 'jit') ORDER BY name"
      )

    %{rows: indexes} =
      Repo.query!(
        "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('activities', 'access_bindings', 'access_contexts', 'access_groups', 'access_group_memberships', 'people', 'resource_nodes') ORDER BY tablename, indexname"
      )

    {revision, _} = System.cmd("git", ["rev-parse", "HEAD"])
    {status, _} = System.cmd("git", ["status", "--short"])
    %{dataset: manifest, postgres: version, settings: settings, indexes: indexes, git_revision: String.trim(revision), git_status: status}
  end
end
