defmodule Operately.Billing.Polar.WebhookVerifier do
  @polar_secret_prefix "polar_whs_"

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
    tolerance_seconds = timestamp_tolerance_seconds()

    if abs(now - timestamp) <= tolerance_seconds do
      :ok
    else
      {:error, :stale_timestamp}
    end
  end

  defp timestamp_tolerance_seconds do
    Application.get_env(:operately, :polar_webhook_timestamp_tolerance_seconds)
  end

  defp parse_signatures(signature_header) do
    signatures =
      signature_header
      |> String.split(" ", trim: true)
      |> Enum.flat_map(fn entry ->
        case String.split(entry, ",", parts: 2) do
          ["v1", encoded_signature] ->
            case decode_base64(encoded_signature) do
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
    keys_to_try = candidate_secret_keys(secret)

    Enum.any?(keys_to_try, fn {_key_label, key_bytes} ->
        expected_signature =
          :crypto.mac(:hmac, :sha256, key_bytes, webhook_id <> "." <> webhook_timestamp <> "." <> raw_body)

        Enum.any?(signatures, fn signature ->
          byte_size(signature) == byte_size(expected_signature) && :crypto.hash_equals(expected_signature, signature)
        end)
      end)
  end

  defp candidate_secret_keys(secret) when is_binary(secret) do
    # Polar follows Standard Webhooks; some docs/examples describe secrets as base64-encoded key
    # material, but real-world setups sometimes behave as if the literal secret string is the key.
    #
    # To avoid false negatives across environments, we try both:
    # - the decoded suffix (when `polar_whs_...` looks like base64/base64url)
    # - the literal secret string bytes
    decoded =
      if String.starts_with?(secret, @polar_secret_prefix) do
        secret
        |> String.replace_prefix(@polar_secret_prefix, "")
        |> decode_base64()
        |> case do
          {:ok, bytes} when byte_size(bytes) > 0 -> bytes
          _ -> nil
        end
      else
        nil
      end

    keys =
      []
      |> maybe_add_key("decoded", decoded)
      |> maybe_add_key("raw", secret)

    keys
  end

  defp maybe_add_key(keys, _label, nil), do: keys

  defp maybe_add_key(keys, label, value) when is_binary(value) do
    keys ++ [{label, value}]
  end

  defp decode_base64(value) when is_binary(value) do
    case Base.decode64(value) do
      {:ok, _} = ok -> ok
      :error -> Base.url_decode64(value, padding: false)
    end
  end
end
