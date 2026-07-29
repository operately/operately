#!/usr/bin/env ruby

require "fileutils"
require "json"
require "optparse"
require "rexml/document"
require "rexml/xpath"
require "set"
require "time"

module TestTimings
  SCHEMA_VERSION = 1

  class Error < StandardError
  end

  class JUnitExtractor
    def extract(report_path:, suite:, shard:)
      document = parse_report(report_path)
      timings = Hash.new(0.0)

      REXML::XPath.each(document, "//testcase") do |testcase|
        file = normalized_file(testcase, report_path)
        timings[file] += testcase_time(testcase, report_path)
      end

      {
        "schema_version" => SCHEMA_VERSION,
        "suite" => suite,
        "shard" => shard,
        "timings" => timings.transform_values { |time| time.round(6) }.sort.to_h,
      }
    end

    private

    def parse_report(report_path)
      REXML::Document.new(File.read(report_path))
    rescue Errno::ENOENT => error
      raise Error, "JUnit report not found: #{error.message}"
    rescue REXML::ParseException => error
      raise Error, "Invalid JUnit XML in #{report_path}: #{error.message}"
    end

    def normalized_file(testcase, report_path)
      file = testcase.attributes["file"]

      if file.nil? || file.empty?
        raise Error, "Testcase in #{report_path} is missing file"
      end

      file.sub(/:\d+\z/, "")
    end

    def testcase_time(testcase, report_path)
      raw_time = testcase.attributes["time"]
      time = Float(raw_time)

      if !time.finite? || time.negative?
        raise ArgumentError
      end

      time
    rescue ArgumentError, TypeError
      raise Error, "Testcase in #{report_path} has invalid time #{raw_time.inspect}"
    end
  end

  class FragmentMerger
    def initialize(expected_shards:)
      @expected_shards = expected_shards
    end

    def merge(fragment_paths:, generated_at:, source_commit:)
      fragments = fragment_paths.map { |path| read_fragment(path) }
      validate_fragment_identities!(fragments)

      {
        "schema_version" => SCHEMA_VERSION,
        "generated_at" => generated_at,
        "source_commit" => source_commit,
        "timings" => merge_timings(fragments),
      }
    end

    private

    def read_fragment(path)
      fragment = JSON.parse(File.read(path))
      validate_fragment!(fragment, path)
      fragment.merge("path" => path)
    rescue Errno::ENOENT => error
      raise Error, "Timing fragment not found: #{error.message}"
    rescue JSON::ParserError => error
      raise Error, "Invalid timing fragment JSON in #{path}: #{error.message}"
    end

    def validate_fragment!(fragment, path)
      unless fragment["schema_version"] == SCHEMA_VERSION
        raise Error, "Unsupported schema version in #{path}"
      end

      unless fragment["suite"].is_a?(String) && positive_integer?(fragment["shard"])
        raise Error, "Invalid shard identity in #{path}"
      end

      unless fragment["timings"].is_a?(Hash)
        raise Error, "Invalid timings map in #{path}"
      end

      fragment["timings"].each do |file, time|
        unless file.is_a?(String) && !file.empty? && valid_time?(time)
          raise Error, "Invalid timing for #{file.inspect} in #{path}"
        end
      end
    end

    def validate_fragment_identities!(fragments)
      identities = Set.new

      fragments.each do |fragment|
        identity = fragment_identity(fragment)

        if identities.include?(identity)
          raise Error, "Duplicate fragment #{identity}"
        end

        identities << identity
      end

      expected = expected_identities
      missing = expected - identities
      unexpected = identities - expected

      raise Error, "Missing fragments: #{missing.to_a.sort.join(", ")}" unless missing.empty?
      raise Error, "Unexpected fragments: #{unexpected.to_a.sort.join(", ")}" unless unexpected.empty?
    end

    def merge_timings(fragments)
      timings = {}
      owners = {}

      fragments.each do |fragment|
        identity = fragment_identity(fragment)

        fragment.fetch("timings").each do |file, time|
          if owners.key?(file)
            raise Error, "#{file} was reported by multiple shards: #{owners[file]} and #{identity}"
          end

          timings[file] = time
          owners[file] = identity
        end
      end

      timings.sort.to_h
    end

    def expected_identities
      @expected_shards.each_with_object(Set.new) do |(suite, shard_count), identities|
        (1..shard_count).each do |shard|
          identities << "#{suite}-#{shard}"
        end
      end
    end

    def fragment_identity(fragment)
      "#{fragment.fetch("suite")}-#{fragment.fetch("shard")}"
    end

    def positive_integer?(value)
      value.is_a?(Integer) && value.positive?
    end

    def valid_time?(value)
      value.is_a?(Numeric) && value.finite? && !value.negative?
    end
  end

  class CLI
    def run(arguments)
      command = arguments.shift

      case command
      when "extract"
        extract(arguments)
      when "merge"
        merge(arguments)
      else
        raise Error, "Expected command: extract or merge"
      end
    rescue Error, OptionParser::ParseError => error
      warn error.message
      1
    end

    private

    def extract(arguments)
      options = parse_extract_options(arguments)
      fragment = JUnitExtractor.new.extract(
        report_path: options.fetch(:report),
        suite: options.fetch(:suite),
        shard: options.fetch(:shard),
      )

      write_json(options.fetch(:output), fragment)
      0
    end

    def merge(arguments)
      options = parse_merge_options(arguments)
      fragment_paths = Dir.glob(File.join(options.fetch(:fragments), "*.json")).sort
      timing_map = FragmentMerger.new(
        expected_shards: {
          "unit" => options.fetch(:unit_shards),
          "feature" => options.fetch(:feature_shards),
        },
      ).merge(
        fragment_paths: fragment_paths,
        generated_at: options.fetch(:generated_at),
        source_commit: options.fetch(:source_commit),
      )

      write_json(options.fetch(:output), timing_map)
      0
    end

    def parse_extract_options(arguments)
      options = {}

      OptionParser.new do |parser|
        parser.on("--report PATH") { |value| options[:report] = value }
        parser.on("--output PATH") { |value| options[:output] = value }
        parser.on("--suite NAME") { |value| options[:suite] = value }
        parser.on("--shard NUMBER", Integer) { |value| options[:shard] = value }
      end.parse!(arguments)

      require_options!(options, :report, :output, :suite, :shard)
      options
    end

    def parse_merge_options(arguments)
      options = {
        generated_at: Time.now.utc.iso8601,
        source_commit: ENV.fetch("SEMAPHORE_GIT_SHA", ""),
      }

      OptionParser.new do |parser|
        parser.on("--fragments PATH") { |value| options[:fragments] = value }
        parser.on("--output PATH") { |value| options[:output] = value }
        parser.on("--unit-shards NUMBER", Integer) { |value| options[:unit_shards] = value }
        parser.on("--feature-shards NUMBER", Integer) { |value| options[:feature_shards] = value }
        parser.on("--generated-at TIME") { |value| options[:generated_at] = value }
        parser.on("--source-commit SHA") { |value| options[:source_commit] = value }
      end.parse!(arguments)

      require_options!(options, :fragments, :output, :unit_shards, :feature_shards)
      options
    end

    def require_options!(options, *keys)
      missing = keys.reject { |key| options.key?(key) }
      return if missing.empty?

      raise Error, "Missing required options: #{missing.map { |key| "--#{key.to_s.tr("_", "-")}" }.join(", ")}"
    end

    def write_json(path, value)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, "#{JSON.pretty_generate(value)}\n")
    end
  end
end

if $PROGRAM_NAME == __FILE__
  exit TestTimings::CLI.new.run(ARGV)
end
