defmodule Mix.Tasks.TestsWithRetries do
  alias Operately.JUnitReportMerger
  alias Operately.JUnitRetrySummary

  @limit 5
  @report_dir "testreports"
  @final_report "junit.xml"
  @retry_summary "retries.md"

  def run(args) do
    report_files = [report_file(0)]

    case run_test(["test"] ++ args, 0) do
      :ok -> finalize_reports(report_files)
      :retry -> retry(args, 1, report_files)
    end
  end

  defp retry(args, count, report_files) when count <= @limit do
    report_files = report_files ++ [report_file(count)]

    case run_test(["test", "--failed"] ++ args, count) do
      :ok ->
        finalize_reports(report_files)

      :retry ->
        retry(args, count + 1, report_files)

      :failed ->
        finalize_reports(report_files)
        exit({:shutdown, 1})
    end
  end

  defp run_test(mix_args, run_index) do
    env = Map.put(System.get_env(), "JUNIT_REPORT_FILE", report_file(run_index))

    case System.cmd("mix", mix_args, env: env, into: IO.stream(:stdio, :line)) do
      {_output, 0} ->
        :ok

      {output, _} ->
        IO.inspect(output)

        if run_index == 0 do
          IO.puts("Rerunning failed tests...")
        end

        if run_index >= @limit do
          :failed
        else
          :retry
        end
    end
  end

  defp finalize_reports(report_files) do
    input_paths = Enum.map(report_files, &Path.join(@report_dir, &1))
    output_path = Path.join(@report_dir, final_report())

    :ok = JUnitReportMerger.merge!(input_paths, output_path)
    :ok = JUnitRetrySummary.write!(input_paths, Path.join(@report_dir, @retry_summary))

    Enum.each(input_paths, fn path ->
      if path != output_path, do: File.rm(path)
    end)
  end

  defp final_report, do: System.get_env("JUNIT_FINAL_REPORT", @final_report)

  defp report_file(index), do: "junit-run-#{index}.xml"
end
