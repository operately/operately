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

  test "write!/2 writes retries.json when retries occurred" do
    output = Path.join(System.tmp_dir!(), "retries-#{System.unique_integer()}.json")
    initial = Path.join(@fixture_dir, "initial_with_failure.xml")
    retry = Path.join(@fixture_dir, "retry_pass.xml")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitRetrySummary.write!([initial, retry], output)

    content = Jason.decode!(File.read!(output))
    assert length(content["flaky"]) == 1
    assert content["failed_after_retries"] == []
  end

  test "write!/2 removes the output file when there were no retries" do
    output = Path.join(System.tmp_dir!(), "retries-#{System.unique_integer()}.json")
    initial = Path.join(@fixture_dir, "initial_pass.xml")

    File.write!(output, "{}")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitRetrySummary.write!([initial], output)

    refute File.exists?(output)
  end

  defp summarize(filenames) do
    filenames
    |> Enum.map(&Path.join(@fixture_dir, &1))
    |> JUnitRetrySummary.summarize()
  end
end
