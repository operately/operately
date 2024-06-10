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
    host = OperatelyWeb.Endpoint.url()
    path = "#{blob.company_id}-#{blob.id}"
    token = Operately.Blobs.Tokens.gen_get_token(path)

    "#{host}/media/#{path}?token=#{token}"
  end

  def get_singed_upload_url(%Blob{} = blob) do
    path = "#{blob.company_id}-#{blob.id}"

    case Application.get_env(:operately, :storage_type) do
      "s3" ->
        bucket = Application.get_env(:operately, :storage_bucket)
        host = Application.get_env(:operately, :storage_host)
        config = ExAws.Config.new(:s3, host: host)

        ExAws.S3.presigned_url(config, :put_object, bucket, path, expires_in: 3600) |> IO.inspect()
      "local" ->
        host = OperatelyWeb.Endpoint.url()
        token = Operately.Blobs.Tokens.gen_upload_token(path)

        {:ok, "#{host}/media/#{path}?token=#{token}"}

      _ ->

        {:error, "Storage type not supported"}
    end
  end
end
