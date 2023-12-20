#!/usr/bin/env ruby

batch_index = ARGV[0].to_i
batch_count = ARGV[1].to_i

files = $stdin.readlines.map(&:strip)

batch_size = (files.size / batch_count.to_f).ceil

start_index = batch_index * batch_size
end_index = start_index + batch_size

puts files[start_index...end_index].join(" ")
