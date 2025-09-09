defmodule OperatelyEE.BeaconCollector do
  @moduledoc """
  Beacon Collector for Enterprise Edition.
  
  This module provides functionality to collect beacon data from self-hosted
  installations and forward it to PostHog for analytics and telemetry.
  """

  require Logger

  @posthog_api_url "https://app.posthog.com/capture/"

  @doc """
  Processes incoming beacon data and forwards it to PostHog.
  
  ## Parameters
  
  - `beacon_data`: A map containing beacon information from self-hosted installation
  
  ## Returns
  
  - `:ok` on successful processing
  - `{:error, reason}` on failure
  
  ## Example
  
      beacon_data = %{
        "version" => "0.1.0",
        "operating_system" => "linux",
        "timestamp" => "2024-01-01T00:00:00Z"
      }
      
      OperatelyEE.BeaconCollector.process_beacon(beacon_data)
  """
  def process_beacon(beacon_data) when is_map(beacon_data) do
    with {:ok, validated_data} <- validate_beacon_data(beacon_data),
         {:ok, _response} <- forward_to_posthog(validated_data) do
      Logger.info("Beacon data processed successfully: #{inspect(validated_data)}")
      :ok
    else
      {:error, reason} = error ->
        Logger.warning("Failed to process beacon data: #{inspect(reason)}")
        error
    end
  end

  def process_beacon(_invalid_data) do
    {:error, :invalid_beacon_data}
  end

  @doc """
  Validates that beacon data contains required fields.
  
  Required fields:
  - version: Operately version string
  - operating_system: Operating system identifier
  - timestamp: ISO8601 timestamp
  """
  def validate_beacon_data(data) do
    # Handle both atom and string keys from JSON
    normalized_data = normalize_keys(data)
    required_fields = ["version", "operating_system", "timestamp"]
    
    missing_fields = Enum.filter(required_fields, &(not Map.has_key?(normalized_data, &1)))
    
    if Enum.empty?(missing_fields) do
      {:ok, normalized_data}
    else
      {:error, {:missing_fields, missing_fields}}
    end
  end

  # Convert atom keys to string keys for consistent handling
  defp normalize_keys(data) when is_map(data) do
    data
    |> Enum.map(fn
      {key, value} when is_atom(key) -> {Atom.to_string(key), value}
      {key, value} -> {key, value}
    end)
    |> Map.new()
  end

  @doc """
  Forwards validated beacon data to PostHog for analytics.
  
  The data is transformed into PostHog event format and sent via their
  capture API endpoint.
  """
  def forward_to_posthog(beacon_data) do
    posthog_event = transform_to_posthog_event(beacon_data)
    
    case send_to_posthog(posthog_event) do
      {:ok, response} -> {:ok, response}
      {:error, reason} -> {:error, {:posthog_error, reason}}
    end
  end

  defp transform_to_posthog_event(beacon_data) do
    %{
      api_key: get_posthog_api_key(),
      event: "self_hosted_beacon",
      properties: %{
        operately_version: beacon_data["version"],
        operating_system: beacon_data["operating_system"],
        beacon_timestamp: beacon_data["timestamp"],
        processed_at: DateTime.utc_now() |> DateTime.to_iso8601()
      },
      distinct_id: generate_installation_id(beacon_data),
      timestamp: beacon_data["timestamp"]
    }
  end

  defp send_to_posthog(event_data) do
    headers = [
      {"content-type", "application/json"},
      {"user-agent", "Operately-BeaconCollector/1.0"}
    ]
    
    body = Jason.encode!(event_data)
    
    case Finch.build(:post, @posthog_api_url, headers, body)
         |> Finch.request(Operately.Finch, receive_timeout: 10_000) do
      {:ok, %Finch.Response{status: status}} when status in 200..299 ->
        {:ok, :sent}
      
      {:ok, %Finch.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}
      
      {:error, reason} ->
        {:error, {:request_failed, reason}}
    end
  end

  defp generate_installation_id(beacon_data) do
    # Generate a consistent but anonymous installation ID
    # based on version and OS but without exposing sensitive data
    data_string = "#{beacon_data["version"]}_#{beacon_data["operating_system"]}"
    
    :crypto.hash(:sha256, data_string)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  defp get_posthog_api_key do
    case System.get_env("POSTHOG_API_KEY") do
      nil -> 
        Logger.error("POSTHOG_API_KEY environment variable not set")
        raise "PostHog API key not configured"
      
      key when is_binary(key) and byte_size(key) > 0 -> 
        key
      
      _ -> 
        raise "Invalid PostHog API key configuration"
    end
  end
end