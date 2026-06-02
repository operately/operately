defmodule Operately.JUnitReportMergerTest do
  use ExUnit.Case, async: true

  alias Operately.JUnitReportMerger

  @fixture_dir Path.join([__DIR__, "..", "fixtures", "junit_reports"])

  test "merge/1 keeps all tests from the initial run" do
    merged = merge(["initial_pass.xml"])

    assert merged =~ ~s{tests="2"}
    assert merged =~ ~s{name="test one"}
    assert merged =~ ~s{name="test two"}
    refute merged =~ "failure"
  end

  test "merge/1 replaces failed tests with retry results" do
    merged = merge(["initial_with_failure.xml", "retry_pass.xml"])

    assert merged =~ ~s{tests="2"}
    assert merged =~ ~s{failures="0"}
    assert merged =~ ~s{name="test one"}
    assert merged =~ ~s{name="test two"}
    refute merged =~ "failure"
  end

  test "merge/1 keeps failures when retries still fail" do
    merged = merge(["initial_with_failure.xml", "retry_still_failing.xml"])

    assert merged =~ ~s{tests="2"}
    assert merged =~ ~s{failures="1"}
    assert merged =~ "still broken"
    refute merged =~ "first failure"
  end

  test "merge!/2 writes merged output to the destination file" do
    output = Path.join(System.tmp_dir!(), "merged-junit-#{System.unique_integer()}.xml")
    initial = Path.join(@fixture_dir, "initial_with_failure.xml")
    retry = Path.join(@fixture_dir, "retry_pass.xml")

    on_exit(fn -> File.rm(output) end)

    :ok = JUnitReportMerger.merge!([initial, retry], output)

    content = File.read!(output)
    assert content =~ ~s{failures="0"}
    assert content =~ ~s{name="test two"}
  end

  defp merge(filenames) do
    filenames
    |> Enum.map(&Path.join(@fixture_dir, &1))
    |> JUnitReportMerger.merge()
  end
end
