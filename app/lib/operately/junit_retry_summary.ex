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

    File.mkdir_p!(Path.dirname(output_path))
    File.write!(output_path, to_markdown(summary))
    log_summary(summary)

    :ok
  end

  @spec to_markdown(summary()) :: String.t()
  def to_markdown(summary) do
    [
      "# Test retries",
      "",
      job_context_section(),
      empty_summary_section(summary),
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

  defp empty_summary_section(%{flaky: [], failed_after_retries: []}) do
    "## Summary\n\nNo tests were retried in this job.\n"
  end

  defp empty_summary_section(_summary), do: nil

  defp job_context do
    name = System.get_env("SEMAPHORE_JOB_NAME")
    index = System.get_env("SEMAPHORE_JOB_INDEX")
    total = System.get_env("SEMAPHORE_JOB_COUNT")

    cond do
      is_binary(name) and name != "" ->
        shard =
          if is_binary(index) and index != "" and is_binary(total) and total != "" do
            " (shard #{index}/#{total})"
          else
            ""
          end

        "- **Job**: #{name}#{shard}"

      true ->
        nil
    end
  end

  @max_message_length 300

  defp summary_section(_title, []), do: nil

  defp summary_section(title, tests) do
    [
      "## #{title}",
      "",
      Enum.map(tests, &test_entry/1)
    ]
    |> List.flatten()
    |> Enum.join("\n")
  end

  defp test_entry(test) do
    lines =
      [
        "- **#{test.name}** — `#{test.file}` (#{test.attempts} attempts)"
      ] ++ Enum.map(failure_lines(test.failures), &("  - " <> &1))

    Enum.join(lines, "\n")
  end

  defp failure_lines(failures) do
    failures
    |> Enum.group_by(& &1.message)
    |> Enum.sort_by(fn {_message, attempts} ->
      attempts |> Enum.map(& &1.run) |> Enum.min()
    end)
    |> Enum.map(fn {message, attempts} ->
      runs = attempts |> Enum.map(& &1.run) |> Enum.sort()
      "error#{format_run_label(runs)}: #{truncate_message(message)}"
    end)
  end

  defp format_run_label([run]), do: " (attempt #{run + 1})"

  defp format_run_label(runs) do
    first = Enum.min(runs) + 1
    last = Enum.max(runs) + 1

    if first == last do
      " (attempt #{first})"
    else
      " (attempts #{first}-#{last})"
    end
  end

  defp truncate_message(nil), do: "unknown failure"

  defp truncate_message(message) do
    message
    |> to_string()
    |> String.trim()
    |> String.split("\n", parts: 2)
    |> hd()
    |> truncate_string(@max_message_length)
  end

  defp truncate_string(text, max) when byte_size(text) <= max, do: text
  defp truncate_string(text, max), do: String.slice(text, 0, max) <> "…"

  @spec summarize([Path.t()]) :: summary()
  def summarize(paths) do
    paths = Enum.filter(paths, &File.exists?/1)

    case paths do
      [] ->
        sort_summary(%{flaky: [], failed_after_retries: []})

      [_initial] ->
        sort_summary(%{flaky: [], failed_after_retries: []})

      paths ->
        paths
        |> Enum.with_index()
        |> Enum.reduce(%{}, &collect_run/2)
        |> Map.values()
        |> Enum.reduce(%{flaky: [], failed_after_retries: []}, &classify_test/2)
        |> sort_summary()
    end
  end

  defp collect_run({path, run_index}, tests) do
    path
    |> JUnitReportMerger.read_testcases()
    |> Enum.reduce(tests, fn {key, testcase}, acc ->
      if skip_attempt?(run_index, testcase.status) do
        acc
      else
        record_attempt(acc, key, testcase, run_index)
      end
    end)
  end

  defp skip_attempt?(0, status), do: status not in [:failures, :errors]
  defp skip_attempt?(_, _), do: false

  defp record_attempt(tests, key, testcase, run_index) do
    attempt = %{
      run: run_index,
      status: testcase.status,
      message: testcase.failure_message
    }

    Map.update(tests, key, %{
      classname: testcase.classname,
      name: testcase.name,
      file: testcase.file,
      attempts: [attempt]
    }, fn existing ->
      %{existing | attempts: existing.attempts ++ [attempt]}
    end)
  end

  defp classify_test(%{attempts: attempts} = test, summary) do
    failures = failure_attempts(attempts)

    cond do
      failures == [] ->
        summary

      length(attempts) <= 1 ->
        summary

      true ->
        entry = %{
          classname: test.classname,
          name: test.name,
          file: test.file,
          attempts: length(attempts),
          failures: failures
        }

        case List.last(attempts) do
          %{status: :pass} ->
            Map.update!(summary, :flaky, &[entry | &1])

          %{status: :skipped} ->
            summary

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
    IO.puts("")

    if flaky == [] and failed == [] do
      IO.puts("Retry summary: no tests were retried")
    else
      flaky_count = length(flaky)
      failed_count = length(failed)

      IO.puts("Retry summary: #{flaky_count} flaky, #{failed_count} failed after retries")

      Enum.each(flaky, fn test ->
        IO.puts("  flaky: #{test.classname} #{test.name} (#{test.attempts} attempts)")
      end)

      Enum.each(failed, fn test ->
        IO.puts("  failed after retries: #{test.classname} #{test.name} (#{test.attempts} attempts)")
      end)
    end

    IO.puts("")
  end
end
