defmodule Operately.Billing.Polar.WebhookVerifier do
  @timestamp_tolerance_seconds 5 * 60

  def verify(raw_body, headers) when is_binary(raw_body) and is_map(headers) do
    with {:ok, secret} <- fetch_secret(),
         {:ok, webhook_id} <- fetch_header(headers, "webhook-id"),
         {:ok, webhook_timestamp} <- fetch_header(headers, "webhook-timestamp"),
         {:ok, timestamp} <- parse_timestamp(webhook_timestamp),
         :ok <- verify_timestamp(timestamp),
         {:ok, signature_header} <- fetch_header(headers, "webhook-signature"),
         {:ok, signatures} <- parse_signatures(signature_header),
         true <- verify_signature(secret, webhook_id, webhook_timestamp, raw_body, signatures) do
      :ok
    else
      {:error, :missing_secret} -> {:error, :missing_secret}
      _ -> {:error, :invalid_signature}
    end
  end

  def verify(_, _), do: {:error, :invalid_signature}

  defp fetch_secret do
    case Application.get_env(:operately, :polar_webhook_secret) do
      secret when is_binary(secret) and secret != "" -> {:ok, secret}
      _ -> {:error, :missing_secret}
    end
  end

  defp fetch_header(headers, name) do
    case Map.get(headers, name) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :missing_header}
    end
  end

  defp parse_timestamp(timestamp) do
    case Integer.parse(timestamp) do
      {value, ""} -> {:ok, value}
      _ -> {:error, :invalid_timestamp}
    end
  end

  defp verify_timestamp(timestamp) do
    now = System.system_time(:second)

    if abs(now - timestamp) <= @timestamp_tolerance_seconds do
      :ok
    else
      {:error, :stale_timestamp}
    end
  end

  defp parse_signatures(signature_header) do
    signatures =
      signature_header
      |> String.split(" ", trim: true)
      |> Enum.flat_map(fn entry ->
        case String.split(entry, ",", parts: 2) do
          ["v1", encoded_signature] ->
            case Base.decode64(encoded_signature) do
              {:ok, signature} -> [signature]
              :error -> []
            end

          _ ->
            []
        end
      end)

    case signatures do
      [] -> {:error, :invalid_signature}
      signatures -> {:ok, signatures}
    end
  end

  defp verify_signature(secret, webhook_id, webhook_timestamp, raw_body, signatures) do
    expected_signature =
      :crypto.mac(:hmac, :sha256, secret, webhook_id <> "." <> webhook_timestamp <> "." <> raw_body)

    Enum.any?(signatures, fn signature ->
      byte_size(signature) == byte_size(expected_signature) && :crypto.hash_equals(expected_signature, signature)
    end)
  end
end
