defmodule Operately.Blobs.Tokens do
  @aad "AES256GCM"

  def validate(operation, path, token) do
    with {:ok, decoded} <- decrypt_raw(token, Application.get_env(:operately, :secret_key_base)),
         {:ok, decoded} <- Jason.decode(decoded),
         {:ok, _} <- validate_operation(operation, decoded),
         {:ok, _} <- validate_path(path, decoded),
         {:ok, _} <- validate_expiration(decoded) do
      :ok
    else
      e ->
        IO.inspect(e)
        {:error, :invalid_token}
    end
  end

  def validate_operation(operation, decoded) do
    if operation == decoded["operation"] do
      {:ok, decoded}
    else
      {:error, :invalid_operation}
    end
  end

  def validate_path(path, decoded) do
    if path == decoded["path"] do
      {:ok, decoded}
    else
      {:error, :invalid_path}
    end
  end

  def validate_expiration(decoded) do
    expires_at = decoded["expires_at"] |> DateTime.from_unix() |> DateTime.to_naive()

    if expires_at > DateTime.utc_now() do
      {:ok, decoded}
    else
      {:error, :expired_token}
    end
  end

  def gen_post_token(path) do
    %{
      path: path, 
      operation: :upload,
      expires_at: expires_at_timestamp(1, :hour)
    } |> Jason.encode! |> encrypt_raw(Application.get_env(:operately, :secret_key_base))
  end

  def gen_get_token(path) do
    %{
      path: path, 
      operation: :get,
      expires_at: expires_at_timestamp(1, :hour)
    } |> Jason.encode! |> encrypt_raw(Application.get_env(:operately, :secret_key_base))
  end

  defp encrypt_raw(val, key) do
    mode       = :aes_gcm
    secret_key = :base64.decode(key)
    iv         = :crypto.strong_rand_bytes(16)

    {ciphertext, ciphertag} = :crypto.block_encrypt(mode, secret_key, {@aad, to_string(val), 16})

    :base64.encode(iv <> ciphertag <> ciphertext)
  end

  defp decrypt_raw(ciphertext, key) do
    mode = :aes_gcm
    secret_key = :base64.decode(key)
    ciphertext = :base64.decode(ciphertext)

    <<iv::binary-16, tag::binary-16, ciphertext::binary>> = ciphertext

    :crypto.block_decrypt(mode, secret_key, iv, {@aad, ciphertext, tag})
  end

  defp expires_at_timestamp(amount, unit) do
    DateTime.utc_now() |> DateTime.add(amount, unit) |> DateTime.to_unix()
  end
end
