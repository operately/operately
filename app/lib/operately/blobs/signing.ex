defmodule Operately.Blobs.Signing do
  @hmac_algorithm :sha256
  # SHA256 produces 32-byte signatures
  @signature_length 32

  #
  # Signs blob tokens using HMAC-SHA256 with the secret key from the application configuration.
  # The generated token is a URL-safe base64 encoded string.
  # Unlike encryption, signing produces the same output for the same input, making it cache-friendly.
  #

  #
  # Public API - uses the secret key from the application configuration
  #
  def sign(val), do: sign(get_key(), val)
  def verify(signature), do: verify(get_key(), signature)

  #
  # Private API - uses the provided key, useful for testing
  #
  def sign(key, val) do
    secret_key = :base64.decode(key)
    signature = :crypto.mac(:hmac, @hmac_algorithm, secret_key, val)
    payload = val <> signature

    {:ok, Base.url_encode64(payload)}
  rescue
    _ -> {:error, :invalid_token}
  end

  def verify(key, signed_token) do
    with {:ok, decoded} <- Base.url_decode64(signed_token),
         {:ok, {payload, signature}} <- extract_payload_and_signature(decoded),
         true <- verify_signature(key, payload, signature) do
      {:ok, payload}
    else
      _ -> {:error, :invalid_token}
    end
  rescue
    _ -> {:error, :invalid_token}
  end

  defp extract_payload_and_signature(decoded) do
    if byte_size(decoded) > @signature_length do
      payload_size = byte_size(decoded) - @signature_length
      payload = binary_part(decoded, 0, payload_size)
      signature = binary_part(decoded, payload_size, @signature_length)
      {:ok, {payload, signature}}
    else
      {:error, :invalid_format}
    end
  end

  defp verify_signature(key, payload, signature) do
    secret_key = :base64.decode(key)
    expected_signature = :crypto.mac(:hmac, @hmac_algorithm, secret_key, payload)

    # Use crypto.hash_equals/2 for timing-safe comparison
    :crypto.hash_equals(expected_signature, signature)
  end

  #
  # Application secret key for blob token signing
  # Uses the same key as encryption for simplicity
  #
  defp get_key do
    Application.get_env(:operately, :blob_token_secret_key)
  end
end
