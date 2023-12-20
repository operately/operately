#!/usr/bin/env ruby

batch_index = ARGV[0].to_i    # based on SEMAPHORE_JOB_INDEX (1-based)
batch_count = ARGV[1].to_i    # based on SEMAPHORE_JOB_COUNT
batch_index = batch_index - 1 # convert to 0-based

files = $stdin.readlines.map(&:strip)

batch_size = (files.size / batch_count.to_f).ceil

start_index = batch_index * batch_size
end_index = start_index + batch_size

files = files[start_index...end_index]

if files.empty?
  puts "No files to process"
  exit 1
end

puts files.join(" ")
