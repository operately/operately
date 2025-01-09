defmodule Operately.Blobs.Tokens do

  alias Operately.Blobs.Encryption

  def validate(operation, path, token) do
    with {:ok, decoded} <- Encryption.decrypt_raw(token),
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
    token = Jason.encode!(%{
      path: path, 
      operation: "upload",
      expires_at: expires_at_timestamp(1, :hour)
    })

    case Encryption.encrypt_raw(token) do
      {:ok, encrypted} -> encrypted
      _ -> {:error, :invalid_token}
    end
  end

  def gen_get_token(path) do
    token = Jason.encode!(%{
      path: path, 
      operation: :get,
      expires_at: expires_at_timestamp(1, :hour)
    }) 

    case Encryption.encrypt_raw(token) do
      {:ok, encrypted} -> encrypted
      _ -> {:error, :invalid_token}
    end
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

  defp expires_at_timestamp(amount, unit) do
    DateTime.utc_now() |> DateTime.add(amount, unit) |> DateTime.to_unix()
  end

end
