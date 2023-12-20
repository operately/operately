#!/usr/bin/env ruby

batch_index = ARGV[0].to_i    # based on SEMAPHORE_JOB_INDEX (1-based)
batch_count = ARGV[1].to_i    # based on SEMAPHORE_JOB_COUNT

if batch_index == 0 || batch_count == 0 || batch_index > batch_count
  puts "Invalid arguments"
  exit 1
end

files = $stdin.readlines.map(&:strip)

class Batch
  attr_reader :files, :size

  def initialize
    @files = []
    @size = 0
  end

  def add_file(file, size)
    @files << file
    @size += size
  end
end

batches = batch_count.times.map { Batch.new }

files.sort_by { |file| File.size(file) }.each do |file|
  batch = batches.min_by(&:size)
  batch.add_file(file, File.size(file))
end

files = batches[batch_index - 1].files

if files.empty?
  puts "No files to process"
  exit 1
end

puts files.join(" ")
