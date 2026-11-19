#!/usr/bin/env ruby

require 'net/http'
require 'uri'
require 'json'

API_TOKEN = ENV['SEMAPHORE_API_TOKEN']
ORG_URL = 'https://operately.semaphoreci.com'
PROJECT_NAME = 'blastoff'
PIPELINE_FILE = '.semaphore/prod.yml'
REF = 'refs/heads/main'

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

def fail(response)
  warn "Semaphore API #{response.code}: #{response.body}"
  exit 1
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
fail(project) unless project.code == '200'

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

fail(workflow) unless %w[200 201].include?(workflow.code)

puts workflow.body
