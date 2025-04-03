defmodule Operately.Blobs.Encryption do
  @cipher :aes_256_gcm
  @tag_size 16
  @iv_size 32
  @aad "blobs"

  #
  # Encrypts blob tokes using the secret key from the application configuration.
  # The generated token is a URL-safe base64 encoded string.
  #

  #
  # Public API - uses the secret key from the application configuration
  #
  def encrypt_raw(val), do: encrypt_raw(get_key(), val)
  def decrypt_raw(ciphertext), do: decrypt_raw(get_key(), ciphertext)

  #
  # Private API - uses the provided key, useful for testing
  #
  def encrypt_raw(key, val) do
    secret_key = :base64.decode(key)
    iv         = :crypto.strong_rand_bytes(@iv_size)
    {ciphertext, tag} = :crypto.crypto_one_time_aead(@cipher, secret_key, iv, val, @aad, true)

    {:ok, Base.url_encode64(iv <> tag <> ciphertext)}
  rescue
    _ -> {:error, :invalid_token}
  end

  def decrypt_raw(key, ciphertext) do
    with {:ok, decoded} <- Base.url_decode64(ciphertext) do
      secret_key = :base64.decode(key)

      iv = binary_part(decoded, 0, @iv_size)
      tag = binary_part(decoded, @iv_size, @tag_size)
      message = binary_part(decoded, @iv_size + @tag_size, byte_size(decoded) - @iv_size - @tag_size)

      {:ok, :crypto.crypto_one_time_aead(@cipher, secret_key, iv, message, @aad, tag, false)}
    else
      _ ->  {:error, :invalid_token}
    end
  rescue
    _ -> {:error, :invalid_token}
  end

  #
  # Application secret key for blob token encryption
  # Generated with: openssl rand -base64 32
  #
  defp get_key do
    Application.get_env(:operately, :blob_token_secret_key)
  end
end
