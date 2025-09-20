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
    token =
      Jason.encode!(%{
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
    expires_at = cache_friendly_expires_at_timestamp(1, :hour)
    token = Jason.encode!(%{path: path, operation: :get, expires_at: expires_at})

    IO.inspect(path)
    IO.inspect(:get)
    IO.inspect(expires_at)
    IO.inspect(token)

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

  # Creates cache-friendly expiration timestamps by rounding to next 2-hour boundary
  # and then adding the specified amount/unit for consistent token generation
  defp cache_friendly_expires_at_timestamp(amount, unit) do
    cache_friendly_time()
    |> DateTime.add(amount, unit)
    |> DateTime.to_unix()
  end

  # Rounds the current time up to the next 2-hour boundary for cache-friendly tokens
  defp cache_friendly_time do
    now = DateTime.utc_now()
    current_hour = now.hour

    # Calculate the next 2-hour boundary
    next_boundary_hour =
      case rem(current_hour, 2) do
        # If on even hour, next boundary is 2 hours later
        0 -> current_hour + 2
        # If on odd hour, next boundary is 1 hour later
        1 -> current_hour + 1
      end

    # Handle day rollover
    {next_day, next_hour} =
      if next_boundary_hour >= 24 do
        {DateTime.add(now, 1, :day), next_boundary_hour - 24}
      else
        {now, next_boundary_hour}
      end

    # Create the rounded time at the next 2-hour boundary
    %{next_day | hour: next_hour, minute: 0, second: 0, microsecond: {0, 0}}
  end
end
