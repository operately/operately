defmodule Operately.JUnitRetrySummaryTest do
  use ExUnit.Case, async: true

  alias Operately.JUnitRetrySummary

  @fixture_dir Path.join([__DIR__, "..", "fixtures", "junit_reports"])

  test "summarize/1 returns empty lists when there were no retries" do
    assert %{flaky: [], failed_after_retries: []} =
             summarize(["initial_pass.xml"])
  end

  test "summarize/1 ignores tests that passed on every run" do
    assert %{flaky: [], failed_after_retries: []} =
             summarize(["initial_pass.xml", "retry_all_pass.xml"])
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

  test "write!/2 writes a no-retries report when nothing was retried" do
    output = Path.join(System.tmp_dir!(), "retries-#{System.unique_integer()}.md")
    initial = Path.join(@fixture_dir, "initial_pass.xml")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitRetrySummary.write!([initial], output)

    markdown = File.read!(output)
    assert markdown =~ "# Test retries"
    assert markdown =~ "No tests were retried in this job."
  end

  test "to_markdown/1 renders the no-retries summary" do
    markdown = JUnitRetrySummary.to_markdown(%{flaky: [], failed_after_retries: []})

    assert markdown =~ "No tests were retried in this job."
    refute markdown =~ "Flaky (passed after retry)"
  end

  test "to_markdown/1 renders failed after retries as a list" do
    summary = summarize(["initial_with_failure.xml", "retry_still_failing.xml"])

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "Failed after all retries"
    assert markdown =~ "- **test two**"
    assert markdown =~ "`test/operately/example_test.exs:2`"
    assert markdown =~ "error (attempt 1): first failure"
    assert markdown =~ "error (attempt 2): still broken"
    refute markdown =~ "| Test |"
    refute markdown =~ "Flaky (passed after retry)"
  end

  test "to_markdown/1 deduplicates identical failure messages across attempts" do
    summary = %{
      flaky: [],
      failed_after_retries: [
        %{
          classname: "Elixir.Operately.ExampleTest",
          name: "test flaky",
          file: "test/operately/example_test.exs:1",
          attempts: 3,
          failures: [
            %{run: 0, message: "same error"},
            %{run: 1, message: "same error"}
          ]
        }
      ]
    }

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "error (attempts 1-2): same error"
    refute markdown =~ "same error; same error"
  end

  test "to_markdown/1 truncates long failure messages" do
    long_message = String.duplicate("x", 400)

    summary = %{
      flaky: [
        %{
          classname: "Elixir.Operately.ExampleTest",
          name: "test long error",
          file: "test/operately/example_test.exs:1",
          attempts: 2,
          failures: [%{run: 0, message: long_message}]
        }
      ],
      failed_after_retries: []
    }

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "…"
    refute markdown =~ long_message
  end

  test "to_markdown/1 includes job name without shard when only job name is set" do
    summary = %{flaky: [], failed_after_retries: []}

    System.put_env("SEMAPHORE_JOB_NAME", "EE Tests")

    on_exit(fn -> System.delete_env("SEMAPHORE_JOB_NAME") end)

    markdown = JUnitRetrySummary.to_markdown(summary)

    assert markdown =~ "**Job**: EE Tests"
    refute markdown =~ "shard"
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
