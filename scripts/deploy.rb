#!/usr/bin/env ruby

require 'net/http'
require 'uri'
require 'json'

TASK_ID = ENV['SEMAPHORE_TASK_ID']
API_TOKEN = ENV['SEMAPHORE_API_TOKEN']
IMAGE_TAG = `git rev-parse --short HEAD`.strip
RELEASE_MESSAGE = `git log -1 --pretty=%B #{IMAGE_TAG}`.split("\n").first.strip

if TASK_ID.nil? || API_TOKEN.nil?
  puts "SEMAPHORE_TASK_ID and SEMAPHORE_API_TOKEN environment variables are required"
  exit 1
end

if IMAGE_TAG.empty? || RELEASE_MESSAGE.empty?
  puts "Failed to get the IMAGE_TAG or RELEASE_MESSAGE"
  exit 1
end

uri = URI.parse("https://operately.semaphoreci.com/api/v1alpha/tasks/#{TASK_ID}/run_now")

request = Net::HTTP::Post.new(uri)
request['Authorization'] = "Token #{API_TOKEN}"
request['Content-Type'] = 'application/json'
request.body = {
  branch: 'main',
  pipeline_file: '.semaphore/prod.yml',
  parameters: {
    IMAGE_TAG: IMAGE_TAG,
    RELEASE_MESSAGE: RELEASE_MESSAGE
  }
}.to_json

begin
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
  
  puts "Response Status: #{response.code}"
  puts "Response Body: #{response.body}"
rescue StandardError => e
  puts "Error: #{e.message}"
end
