require "json"
require "fileutils"
require "minitest/autorun"
require "tmpdir"

require_relative "collector"

class TestTimingsCollectorTest < Minitest::Test
  def setup
    @tmp_dir = Dir.mktmpdir("test-timings")
  end

  def teardown
    FileUtils.remove_entry(@tmp_dir)
  end

  def test_extracts_and_sums_timings_by_normalized_file
    report_path = write_file("junit.xml", <<~XML)
      <?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        <testsuite name="FirstModule">
          <testcase file="test/example_test.exs:10" time="0.5000"/>
          <testcase file="test/example_test.exs:20" time="0.7500"/>
        </testsuite>
        <testsuite name="SecondModule">
          <testcase file="ee/test/features/admin_test.exs:4" time="1.2500"/>
        </testsuite>
      </testsuites>
    XML

    fragment = TestTimings::JUnitExtractor.new.extract(report_path: report_path, suite: "feature", shard: 3)

    assert_equal 1, fragment.fetch("schema_version")
    assert_equal "feature", fragment.fetch("suite")
    assert_equal 3, fragment.fetch("shard")
    assert_equal(
      {
        "ee/test/features/admin_test.exs" => 1.25,
        "test/example_test.exs" => 1.25,
      },
      fragment.fetch("timings"),
    )
  end

  def test_rejects_testcases_without_a_file
    report_path = write_file("missing-file.xml", <<~XML)
      <testsuites>
        <testsuite name="Example">
          <testcase time="0.5"/>
        </testsuite>
      </testsuites>
    XML

    error = assert_raises(TestTimings::Error) do
      TestTimings::JUnitExtractor.new.extract(report_path: report_path, suite: "unit", shard: 1)
    end

    assert_includes error.message, "missing-file.xml"
    assert_includes error.message, "missing file"
  end

  def test_rejects_missing_or_invalid_timings
    ["", "not-a-number", "NaN", "-0.1"].each_with_index do |time, index|
      time_attribute = time.empty? ? "" : %( time="#{time}")
      report_path = write_file("invalid-time-#{index}.xml", <<~XML)
        <testsuites>
          <testsuite name="Example">
            <testcase file="test/example_test.exs:1"#{time_attribute}/>
          </testsuite>
        </testsuites>
      XML

      error = assert_raises(TestTimings::Error) do
        TestTimings::JUnitExtractor.new.extract(report_path: report_path, suite: "unit", shard: 1)
      end

      assert_includes error.message, "invalid time"
    end
  end

  def test_rejects_malformed_xml
    report_path = write_file("malformed.xml", "<testsuites><testsuite>")

    error = assert_raises(TestTimings::Error) do
      TestTimings::JUnitExtractor.new.extract(report_path: report_path, suite: "unit", shard: 1)
    end

    assert_includes error.message, "malformed.xml"
    assert_includes error.message, "Invalid JUnit XML"
  end

  def test_merges_the_complete_expected_fragment_set
    fragment_paths = write_complete_fragment_set
    generated_at = "2026-07-29T12:00:00Z"

    timing_map = TestTimings::FragmentMerger.new(expected_shards: { "unit" => 2, "feature" => 18 }).merge(
      fragment_paths: fragment_paths,
      generated_at: generated_at,
      source_commit: "abc123",
    )

    assert_equal 1, timing_map.fetch("schema_version")
    assert_equal generated_at, timing_map.fetch("generated_at")
    assert_equal "abc123", timing_map.fetch("source_commit")
    assert_equal 20, timing_map.fetch("timings").length
    assert_equal timing_map.fetch("timings").keys.sort, timing_map.fetch("timings").keys
  end

  def test_rejects_a_missing_shard
    fragment_paths = write_complete_fragment_set
    fragment_paths.delete(fragment_paths.last)

    error = assert_raises(TestTimings::Error) do
      merge_fragments(fragment_paths)
    end

    assert_includes error.message, "Missing fragments"
    assert_includes error.message, "feature-18"
  end

  def test_rejects_duplicate_shard_identities
    fragment_paths = write_complete_fragment_set
    duplicate_path = File.join(@tmp_dir, "duplicate.json")
    FileUtils.cp(fragment_paths.first, duplicate_path)
    fragment_paths << duplicate_path

    error = assert_raises(TestTimings::Error) do
      merge_fragments(fragment_paths)
    end

    assert_includes error.message, "Duplicate fragment unit-1"
  end

  def test_rejects_files_reported_by_multiple_shards
    fragment_paths = write_complete_fragment_set
    overlapping_fragment = JSON.parse(File.read(fragment_paths.last))
    overlapping_fragment.fetch("timings")["test/unit_1_test.exs"] = 4.2
    File.write(fragment_paths.last, JSON.generate(overlapping_fragment))

    error = assert_raises(TestTimings::Error) do
      merge_fragments(fragment_paths)
    end

    assert_includes error.message, "test/unit_1_test.exs"
    assert_includes error.message, "multiple shards"
  end

  def test_cli_extracts_a_fragment_to_json
    report_path = write_file("cli-junit.xml", <<~XML)
      <testsuites>
        <testsuite name="Example">
          <testcase file="test/example_test.exs:7" time="0.25"/>
        </testsuite>
      </testsuites>
    XML
    output_path = File.join(@tmp_dir, "fragment.json")

    exit_code = TestTimings::CLI.new.run([
      "extract",
      "--report", report_path,
      "--output", output_path,
      "--suite", "unit",
      "--shard", "2",
    ])

    assert_equal 0, exit_code
    assert_equal(
      {
        "schema_version" => 1,
        "suite" => "unit",
        "shard" => 2,
        "timings" => { "test/example_test.exs" => 0.25 },
      },
      JSON.parse(File.read(output_path)),
    )
  end

  def test_cli_merges_fragments_to_the_persistent_schema
    write_complete_fragment_set
    output_path = File.join(@tmp_dir, "merged", "test-timings-v1.json")

    exit_code = TestTimings::CLI.new.run([
      "merge",
      "--fragments", @tmp_dir,
      "--output", output_path,
      "--unit-shards", "2",
      "--feature-shards", "18",
      "--generated-at", "2026-07-29T12:00:00Z",
      "--source-commit", "abc123",
    ])

    assert_equal 0, exit_code

    timing_map = JSON.parse(File.read(output_path))
    assert_equal 1, timing_map.fetch("schema_version")
    assert_equal "2026-07-29T12:00:00Z", timing_map.fetch("generated_at")
    assert_equal "abc123", timing_map.fetch("source_commit")
    assert_equal 20, timing_map.fetch("timings").length
  end

  private

  def merge_fragments(fragment_paths)
    TestTimings::FragmentMerger.new(expected_shards: { "unit" => 2, "feature" => 18 }).merge(
      fragment_paths: fragment_paths,
      generated_at: "2026-07-29T12:00:00Z",
      source_commit: "abc123",
    )
  end

  def write_complete_fragment_set
    { "unit" => 2, "feature" => 18 }.flat_map do |suite, shard_count|
      (1..shard_count).map do |shard|
        write_fragment(suite: suite, shard: shard)
      end
    end
  end

  def write_fragment(suite:, shard:)
    path = File.join(@tmp_dir, "#{suite}-#{shard}.json")
    timing = suite == "unit" ? shard.to_f : shard.to_f / 10
    file = "#{suite == "unit" ? "test" : "test/features"}/#{suite}_#{shard}_test.exs"

    File.write(path, JSON.generate({
      "schema_version" => 1,
      "suite" => suite,
      "shard" => shard,
      "timings" => { file => timing },
    }))

    path
  end

  def write_file(name, contents)
    path = File.join(@tmp_dir, name)
    File.write(path, contents)
    path
  end
end
