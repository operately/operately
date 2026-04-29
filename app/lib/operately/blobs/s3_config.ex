defmodule Operately.Blobs.S3Config do
  @moduledoc """
  Centralized S3 configuration for blob storage.
  Fails fast at startup if required environment variables are missing.
  """

  @doc """
  Returns the S3 bucket name.
  Raises if OPERATELY_STORAGE_S3_BUCKET is not set.
  """
  def bucket! do
    System.get_env("OPERATELY_STORAGE_S3_BUCKET") ||
      raise "OPERATELY_STORAGE_S3_BUCKET environment variable is required for S3 storage"
  end

  @doc """
  Returns the S3 region.
  Raises if OPERATELY_STORAGE_S3_REGION is not set.
  """
  def region! do
    System.get_env("OPERATELY_STORAGE_S3_REGION") ||
      raise "OPERATELY_STORAGE_S3_REGION environment variable is required for S3 storage"
  end

  @doc """
  Returns the S3 access key ID.
  Raises if OPERATELY_STORAGE_S3_ACCESS_KEY_ID is not set.
  """
  def access_key_id! do
    System.get_env("OPERATELY_STORAGE_S3_ACCESS_KEY_ID") ||
      raise "OPERATELY_STORAGE_S3_ACCESS_KEY_ID environment variable is required for S3 storage"
  end

  @doc """
  Returns the S3 secret access key.
  Raises if OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY is not set.
  """
  def secret_access_key! do
    System.get_env("OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY") ||
      raise "OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY environment variable is required for S3 storage"
  end

  @doc """
  Returns the S3 host (optional, for S3-compatible services).
  """
  def host do
    System.get_env("OPERATELY_STORAGE_S3_HOST")
  end

  @doc """
  Returns the S3 scheme (optional, defaults to https).
  """
  def scheme do
    System.get_env("OPERATELY_STORAGE_S3_SCHEME") || "https"
  end

  @doc """
  Returns the S3 port (optional).
  """
  def port do
    System.get_env("OPERATELY_STORAGE_S3_PORT")
  end

  @doc """
  Returns ExAws config map for S3 operations.
  """
  def ex_aws_config do
    %{
      access_key_id: access_key_id!(),
      secret_access_key: secret_access_key!(),
      region: region!()
    }
  end

  @doc """
  Returns ExAws request overrides for S3-compatible object storage.
  """
  def request_config do
    [
      access_key_id: access_key_id!(),
      secret_access_key: secret_access_key!(),
      region: region!(),
      virtual_host: false,
      scheme: request_scheme()
    ]
    |> maybe_put(:host, host())
    |> maybe_put(:port, request_port())
  end

  defp request_scheme do
    case scheme() do
      scheme when is_binary(scheme) ->
        if String.ends_with?(scheme, "://"), do: scheme, else: scheme <> "://"
    end
  end

  defp request_port do
    case port() do
      nil -> nil
      port when is_binary(port) -> String.to_integer(port)
    end
  end

  defp maybe_put(config, _key, nil), do: config
  defp maybe_put(config, key, value), do: Keyword.put(config, key, value)
end
