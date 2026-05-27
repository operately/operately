defmodule Operately.Billing.Polar.WebhookObservability do
  @moduledoc false

  require Logger

  @ingest_event [:operately, :billing, :webhook, :ingest]
  @process_event [:operately, :billing, :webhook, :process, :stop]
  @retry_event [:operately, :billing, :webhook, :process, :retry]

  def ingest(result, attrs \\ %{}) do
    metadata = metadata_for(result, attrs)

    :telemetry.execute(@ingest_event, %{count: 1}, telemetry_metadata(metadata))
    log_ingest(metadata)
  end

  def process(result, attrs, measurements) do
    metadata = metadata_for(result, attrs)
    measurements = process_measurements(measurements)

    :telemetry.execute(@process_event, measurements, telemetry_metadata(metadata))
    log_process(metadata, measurements)
  end

  def retry(attrs \\ %{}) do
    metadata = metadata_for(:retry, attrs)

    :telemetry.execute(@retry_event, %{count: 1}, telemetry_metadata(metadata))
    Logger.warning("Polar webhook retry: #{inspect(log_metadata(metadata))}")
  end

  defp metadata_for(result, attrs) do
    attrs
    |> Enum.into(%{})
    |> Map.take([:provider, :event_type, :request_id, :webhook_id, :billing_webhook_event_id, :company_id, :attempt, :max_attempts, :queue, :reason])
    |> Map.put(:provider, normalize_provider(Map.get(attrs, :provider)))
    |> Map.put(:result, normalize_result(result))
    |> Map.put(:event_type, normalize_event_type(Map.get(attrs, :event_type)))
    |> maybe_put(:reason, normalize_reason(Map.get(attrs, :reason)))
  end

  defp telemetry_metadata(metadata) do
    metadata
    |> Map.take([:provider, :result, :event_type, :request_id, :webhook_id, :billing_webhook_event_id, :company_id, :attempt, :max_attempts, :queue, :reason])
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp log_ingest(%{result: result} = metadata) when result in ["missing_secret", "internal_error"] do
    Logger.error("Polar webhook ingest failed: #{inspect(log_metadata(metadata))}")
  end

  defp log_ingest(%{result: result} = metadata) when result in ["invalid_payload", "invalid_signature", "invalid_json"] do
    Logger.warning("Polar webhook ingest rejected: #{inspect(log_metadata(metadata))}")
  end

  defp log_ingest(metadata) do
    Logger.info("Polar webhook ingest: #{inspect(log_metadata(metadata))}")
  end

  defp log_process(%{result: result} = metadata, measurements) when result in ["retryable_failed", "internal_error"] do
    Logger.error("Polar webhook processing failed: #{inspect(log_metadata(metadata, measurements))}")
  end

  defp log_process(%{result: "discarded"} = metadata, measurements) do
    Logger.warning("Polar webhook processing discarded: #{inspect(log_metadata(metadata, measurements))}")
  end

  defp log_process(metadata, measurements) do
    Logger.info("Polar webhook processing: #{inspect(log_metadata(metadata, measurements))}")
  end

  defp log_metadata(metadata, measurements \\ %{}) do
    metadata
    |> Map.merge(%{
      duration_ms: duration_ms(measurements[:duration]),
      lag_ms: measurements[:lag_ms]
    })
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp process_measurements(measurements) do
    duration = Map.get(measurements, :duration, 0)
    lag_ms = Map.get(measurements, :lag_ms, 0)

    %{duration: duration, lag_ms: lag_ms}
  end

  defp duration_ms(nil), do: nil
  defp duration_ms(duration), do: System.convert_time_unit(duration, :native, :millisecond)

  defp normalize_provider(nil), do: "polar"
  defp normalize_provider(provider) when is_binary(provider), do: provider
  defp normalize_provider(provider), do: to_string(provider)

  defp normalize_result(result) when is_atom(result), do: Atom.to_string(result)
  defp normalize_result(result) when is_binary(result), do: result
  defp normalize_result(result), do: inspect(result)

  defp normalize_event_type(event_type) when is_binary(event_type) and event_type != "", do: event_type
  defp normalize_event_type(_event_type), do: "unknown"

  defp normalize_reason(nil), do: nil
  defp normalize_reason(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp normalize_reason(reason) when is_binary(reason), do: reason
  defp normalize_reason(reason), do: inspect(reason)

  defp maybe_put(metadata, _key, nil), do: metadata
  defp maybe_put(metadata, key, value), do: Map.put(metadata, key, value)
end
