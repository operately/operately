defmodule Operately.Blobs.Tokens do
  @cipher :aes_256_gcm
  @tag_size 16
  @iv_size 32
  @aad "blobs"

  def gen_new_secret_key do
    :crypto.strong_rand_bytes(32) |> :base64.encode()
  end

  def validate(operation, path, token) do
    with {:ok, decoded} <- decrypt_raw(token),
         {:ok, decoded} <- Jason.decode(decoded),
         {:ok, _} <- validate_operation(operation, decoded),
         {:ok, _} <- validate_path(path, decoded),
         {:ok, _} <- validate_expiration(decoded) do
      :ok
    else
      e -> e
    end
  end

  def gen_upload_token(path) do
    %{
      path: path, 
      operation: "upload",
      expires_at: expires_at_timestamp(1, :hour)
    } |> Jason.encode! |> encrypt_raw()
  end

  def gen_get_token(path) do
    %{
      path: path, 
      operation: :get,
      expires_at: expires_at_timestamp(1, :hour)
    } |> Jason.encode! |> encrypt_raw()
  end

  defp validate_operation(operation, decoded) do
    if operation == decoded["operation"] do
      {:ok, decoded}
    else
      {:error, :invalid_operation}
    end
  end

  defp validate_path(path, decoded) do
    if path == decoded["path"] do
      {:ok, decoded}
    else
      {:error, :invalid_path}
    end
  end

  defp validate_expiration(decoded) do
    case DateTime.from_unix(decoded["expires_at"]) do
      {:ok, expires_at} -> 
        expires_at = expires_at |> DateTime.to_unix()
        now = DateTime.utc_now() |> DateTime.to_unix()

        if expires_at >= now do
          {:ok, decoded}
        else
          {:error, :invalid_expiration}
        end

      {:error, _} -> 
        {:error, :invalid_expiration}
    end
  end

  defp key do
    Application.get_env(:operately, :blob_token_secret_key)
  end

  defp encrypt_raw(val) do
    secret_key = :base64.decode(key())
    iv         = :crypto.strong_rand_bytes(@iv_size)

    {ciphertext, tag} = :crypto.crypto_one_time_aead(@cipher, secret_key, iv, val, @aad, true)

    :base64.encode(iv <> tag <> ciphertext)
  end

  defp decrypt_raw(ciphertext) do
    secret_key = :base64.decode(key())
    ciphertext = :base64.decode(ciphertext)

    iv = binary_part(ciphertext, 0, @iv_size)
    tag = binary_part(ciphertext, @iv_size, @tag_size)
    ciphertext = binary_part(ciphertext, @iv_size + @tag_size, byte_size(ciphertext) - @iv_size - @tag_size)

    {:ok, :crypto.crypto_one_time_aead(@cipher, secret_key, iv, ciphertext, @aad, tag, false)}
  end

  defp expires_at_timestamp(amount, unit) do
    DateTime.utc_now() |> DateTime.add(amount, unit) |> DateTime.to_unix()
  end

end
