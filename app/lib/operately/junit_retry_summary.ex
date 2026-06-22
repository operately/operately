defmodule Operately.JUnitRetrySummary do
  @moduledoc false

  alias Operately.JUnitReportMerger

  @type summary :: %{
          flaky: [map()],
          failed_after_retries: [map()]
        }

  @spec write!([Path.t()], Path.t()) :: :ok
  def write!(paths, output_path) do
    summary = summarize(paths)

    if summary.flaky == [] and summary.failed_after_retries == [] do
      if File.exists?(output_path), do: File.rm(output_path)
    else
      File.mkdir_p!(Path.dirname(output_path))
      File.write!(output_path, to_markdown(summary))
      log_summary(summary)
    end

    :ok
  end

  @spec to_markdown(summary()) :: String.t()
  def to_markdown(summary) do
    [
      "# Test retries",
      "",
      job_context_section(),
      summary_section("Flaky (passed after retry)", summary.flaky),
      summary_section("Failed after all retries", summary.failed_after_retries)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp job_context_section do
    case job_context() do
      nil -> nil
      context -> "## Job\n\n#{context}\n"
    end
  end

  defp job_context do
    name = System.get_env("SEMAPHORE_JOB_NAME")
    index = System.get_env("SEMAPHORE_JOB_INDEX")
    total = System.get_env("SEMAPHORE_JOB_COUNT")

    cond do
      is_binary(name) and name != "" and is_binary(index) and index != "" ->
        shard =
          if is_binary(total) and total != "" do
            " (shard #{index}/#{total})"
          else
            ""
          end

        "- **Job**: #{name}#{shard}"

      true ->
        nil
    end
  end

  defp summary_section(_title, []), do: nil

  defp summary_section(title, tests) do
    [
      "## #{title}",
      "",
      "| Test | File | Attempts | Failures |",
      "| --- | --- | ---: | --- |",
      Enum.map(tests, &test_row/1)
    ]
    |> List.flatten()
    |> Enum.join("\n")
  end

  defp test_row(test) do
    test_label = "#{test.classname} — #{test.name}"
    failures = format_failures(test.failures)

    "| #{escape_table_cell(test_label)} | #{escape_table_cell(test.file)} | #{test.attempts} | #{escape_table_cell(failures)} |"
  end

  defp format_failures(failures) do
    failures
    |> Enum.map(fn failure ->
      message = failure.message || "unknown failure"
      "run #{failure.run}: #{message}"
    end)
    |> Enum.join("; ")
  end

  defp escape_table_cell(value) do
    value
    |> to_string()
    |> String.replace("|", "\\|")
    |> String.replace("\n", " ")
  end

  @spec summarize([Path.t()]) :: summary()
  def summarize(paths) do
    paths
    |> Enum.filter(&File.exists?/1)
    |> Enum.with_index()
    |> Enum.reduce(%{}, &collect_run/2)
    |> Map.values()
    |> Enum.reduce(%{flaky: [], failed_after_retries: []}, &classify_test/2)
    |> sort_summary()
  end

  defp collect_run({path, run_index}, tests) do
    path
    |> JUnitReportMerger.read_testcases()
    |> Enum.reduce(tests, fn {key, testcase}, acc ->
      attempt = %{
        run: run_index,
        status: testcase.status,
        message: testcase.failure_message
      }

      Map.update(acc, key, %{
        classname: testcase.classname,
        name: testcase.name,
        file: testcase.file,
        attempts: [attempt]
      }, fn existing ->
        %{existing | attempts: existing.attempts ++ [attempt]}
      end)
    end)
  end

  defp classify_test(%{attempts: attempts} = test, summary) do
    if length(attempts) <= 1 do
      summary
    else
      entry = %{
        classname: test.classname,
        name: test.name,
        file: test.file,
        attempts: length(attempts),
        failures: failure_attempts(attempts)
      }

      case List.last(attempts) do
        %{status: :pass} ->
          Map.update!(summary, :flaky, &[entry | &1])

        _ ->
          Map.update!(summary, :failed_after_retries, &[entry | &1])
      end
    end
  end

  defp failure_attempts(attempts) do
    attempts
    |> Enum.filter(fn attempt -> attempt.status in [:failures, :errors] end)
    |> Enum.map(fn attempt ->
      %{run: attempt.run, message: attempt.message}
    end)
  end

  defp sort_summary(summary) do
    %{
      flaky: Enum.sort_by(summary.flaky, &{&1.classname, &1.name}),
      failed_after_retries: Enum.sort_by(summary.failed_after_retries, &{&1.classname, &1.name})
    }
  end

  defp log_summary(%{flaky: flaky, failed_after_retries: failed}) do
    flaky_count = length(flaky)
    failed_count = length(failed)

    IO.puts("")
    IO.puts("Retry summary: #{flaky_count} flaky, #{failed_count} failed after retries")

    Enum.each(flaky, fn test ->
      IO.puts("  flaky: #{test.classname} #{test.name} (#{test.attempts} attempts)")
    end)

    Enum.each(failed, fn test ->
      IO.puts("  failed after retries: #{test.classname} #{test.name} (#{test.attempts} attempts)")
    end)

    IO.puts("")
  end
end
