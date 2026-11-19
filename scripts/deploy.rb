#!/usr/bin/env ruby

require 'net/http'
require 'uri'
require 'json'

API_TOKEN = ENV['SEMAPHORE_API_TOKEN']
ORG_URL = 'https://operately.semaphoreci.com'
PROJECT_NAME = 'blastoff'
PIPELINE_FILE = '.semaphore/prod.yml'
REF = 'refs/heads/main'
POLL_INTERVAL = 30
TIMEOUT = 60 * 60

IMAGE_TAG = `git rev-parse --short HEAD`.strip
RELEASE_MESSAGE = `git log -1 --pretty=%B #{IMAGE_TAG}`.split("\n").first.strip

def request(method, path, body = nil)
  uri = URI.parse("#{ORG_URL}#{path}")
  http_request = method == :get ? Net::HTTP::Get.new(uri) : Net::HTTP::Post.new(uri)
  http_request['Authorization'] = "Token #{API_TOKEN}"
  http_request['Content-Type'] = 'application/json'
  http_request.body = body.to_json if body

  Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(http_request) }
end

def abort_on_api_error(response)
  warn "Semaphore API #{response.code}: #{response.body}"
  exit 1
end

def wait_for_pipeline(pipeline_id)
  deadline = Time.now + TIMEOUT

  loop do
    response = request(:get, "/api/v1alpha/pipelines/#{pipeline_id}")
    abort_on_api_error(response) unless response.code == '200'

    pipeline = JSON.parse(response.body)['pipeline'] || {}
    state = pipeline['state']
    result = pipeline['result']
    puts "Pipeline #{pipeline_id}: state=#{state} result=#{result}"

    return result if state == 'done'

    if Time.now > deadline
      warn "Timed out waiting for pipeline #{pipeline_id}"
      exit 1
    end

    sleep POLL_INTERVAL
  end
end

if API_TOKEN.nil? || API_TOKEN.empty?
  warn 'SEMAPHORE_API_TOKEN is required'
  exit 1
end

if IMAGE_TAG.empty? || RELEASE_MESSAGE.empty?
  warn 'Failed to get the IMAGE_TAG or RELEASE_MESSAGE'
  exit 1
end

project = request(:get, "/api/v1alpha/projects/#{PROJECT_NAME}")
abort_on_api_error(project) unless project.code == '200'

project_id = JSON.parse(project.body).dig('metadata', 'id')
if project_id.nil? || project_id.empty?
  warn "Semaphore project #{PROJECT_NAME} has no id"
  exit 1
end

workflow = request(:post, '/api/v1alpha/plumber-workflows', {
  project_id: project_id,
  reference: REF,
  pipeline_file: PIPELINE_FILE,
  parameters: {
    IMAGE_TAG: IMAGE_TAG,
    RELEASE_MESSAGE: RELEASE_MESSAGE
  }
})

abort_on_api_error(workflow) unless %w[200 201].include?(workflow.code)

pipeline_id = JSON.parse(workflow.body)['pipeline_id']
if pipeline_id.nil? || pipeline_id.empty?
  warn 'Semaphore did not return a pipeline_id'
  exit 1
end

puts "Started blastoff workflow, pipeline #{pipeline_id}"

result = wait_for_pipeline(pipeline_id)

if result == 'passed'
  puts 'Production deployment passed'
else
  warn "Production deployment finished with result=#{result}"
  exit 1
end
