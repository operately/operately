defmodule Operately.Blobs do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Blobs.Blob

  def list_blobs do
    Repo.all(Blob)
  end

  def get_blob!(id), do: Repo.get!(Blob, id)

  def create_blob(attrs \\ %{}) do
    %Blob{}
    |> Blob.changeset(attrs)
    |> Repo.insert()
  end

  def update_blob(%Blob{} = blob, attrs) do
    blob
    |> Blob.changeset(attrs)
    |> Repo.update()
  end

  def delete_blob(%Blob{} = blob) do
    Repo.delete(blob)
  end

  def change_blob(%Blob{} = blob, attrs \\ %{}) do
    Blob.changeset(blob, attrs)
  end

  def get_signed_get_url(%Blob{} = blob) do
    path = "#{blob.company_id}-#{blob.id}"

    case Application.get_env(:operately, :storage_type) do
      "s3" ->
        {:ok, presigned_s3_url("GET", path)}

      "local" ->
        host = OperatelyWeb.Endpoint.url()
        path = "#{blob.company_id}-#{blob.id}"
        token = Operately.Blobs.Tokens.gen_get_token(path)

        {:ok, "#{host}/media/#{path}?token=#{token}"}
      _ ->
        {:error, "Storage type not supported"}
    end
  end

  def get_signed_upload_url(%Blob{} = blob) do
    path = "#{blob.company_id}-#{blob.id}"

    case Application.get_env(:operately, :storage_type) do
      "s3" ->
        {:ok, presigned_s3_url("PUT", path)}
      "local" ->
        host = OperatelyWeb.Endpoint.url()
        token = Operately.Blobs.Tokens.gen_upload_token(path)

        {:ok, "#{host}/media/#{path}?token=#{token}"}
      _ ->
        {:error, "Storage type not supported"}
    end
  end

  defp presigned_s3_url(method, path, expires_in \\ 3600) when method in ["GET", "PUT"] do
    host = System.get_env("OPERATELY_STORAGE_S3_HOST")
    scheme = System.get_env("OPERATELY_STORAGE_S3_SCHEME")
    port = System.get_env("OPERATELY_STORAGE_S3_PORT", "443")
    bucket = System.get_env("OPERATELY_STORAGE_S3_BUCKET")
    region = System.get_env("OPERATELY_STORAGE_S3_REGION")
    access_key_id = System.get_env("OPERATELY_STORAGE_S3_ACCESS_KEY_ID")
    secret_access_key = System.get_env("OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY")

    uri = "#{scheme}://#{host}:#{port}/#{bucket}/#{URI.encode(path)}"

    :aws_signature.sign_v4_query_params(
      access_key_id,
      secret_access_key,
      region,
      "S3",
      :calendar.universal_time(),
      method,
      uri,
      ttl: expires_in,
      uri_encode_path: false,
      body_digest: "UNSIGNED-PAYLOAD"
    )
    |> IO.inspect()
  end
end
