defmodule Operately.JUnitRetrySummaryTest do
  use ExUnit.Case, async: true

  alias Operately.JUnitRetrySummary

  @fixture_dir Path.join([__DIR__, "..", "fixtures", "junit_reports"])

  test "summarize/1 returns empty lists when there were no retries" do
    assert %{flaky: [], failed_after_retries: []} =
             summarize(["initial_pass.xml"])
  end

  test "summarize/1 records flaky tests that pass after a retry" do
    summary = summarize(["initial_with_failure.xml", "retry_pass.xml"])

    assert summary.flaky == [
             %{
               classname: "Elixir.Operately.ExampleTest",
               name: "test two",
               file: "test/operately/example_test.exs:2",
               attempts: 2,
               failures: [%{run: 0, message: "first failure"}]
             }
           ]

    assert summary.failed_after_retries == []
  end

  test "summarize/1 records tests that fail after all retries" do
    summary = summarize(["initial_with_failure.xml", "retry_still_failing.xml"])

    assert summary.flaky == []

    assert summary.failed_after_retries == [
             %{
               classname: "Elixir.Operately.ExampleTest",
               name: "test two",
               file: "test/operately/example_test.exs:2",
               attempts: 2,
               failures: [
                 %{run: 0, message: "first failure"},
                 %{run: 1, message: "still broken"}
               ]
             }
           ]
  end

  test "write!/2 writes retries.md when retries occurred" do
    output = Path.join(System.tmp_dir!(), "retries-#{System.unique_integer()}.md")
    initial = Path.join(@fixture_dir, "initial_with_failure.xml")
    retry = Path.join(@fixture_dir, "retry_pass.xml")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitRetrySummary.write!([initial, retry], output)

    markdown = File.read!(output)
    assert markdown =~ "# Test retries"
    assert markdown =~ "Flaky (passed after retry)"
    assert markdown =~ "test two"
    assert markdown =~ "first failure"
  end

  test "write!/2 removes the output file when there were no retries" do
    output = Path.join(System.tmp_dir!(), "retries-#{System.unique_integer()}.md")
    initial = Path.join(@fixture_dir, "initial_pass.xml")

    File.write!(output, "# Test retries")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitRetrySummary.write!([initial], output)

    refute File.exists?(output)
  end

  test "to_markdown/1 renders failed after retries" do
    summary = summarize(["initial_with_failure.xml", "retry_still_failing.xml"])

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "Failed after all retries"
    assert markdown =~ "still broken"
    refute markdown =~ "Flaky (passed after retry)"
  end

  test "to_markdown/1 includes job context when Semaphore env vars are set" do
    summary = summarize(["initial_with_failure.xml", "retry_pass.xml"])

    System.put_env("SEMAPHORE_JOB_NAME", "Features")
    System.put_env("SEMAPHORE_JOB_INDEX", "3")
    System.put_env("SEMAPHORE_JOB_COUNT", "18")

    on_exit(fn ->
      System.delete_env("SEMAPHORE_JOB_NAME")
      System.delete_env("SEMAPHORE_JOB_INDEX")
      System.delete_env("SEMAPHORE_JOB_COUNT")
    end)

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "**Job**: Features (shard 3/18)"
  end

  defp summarize(filenames) do
    filenames
    |> Enum.map(&Path.join(@fixture_dir, &1))
    |> JUnitRetrySummary.summarize()
  end
end
