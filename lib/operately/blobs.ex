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
    host = OperatelyWeb.Endpoint.url()
    path = "#{blob.company_id}-#{blob.id}"
    token = Operately.Blobs.Tokens.gen_upload_token(path)

    "#{host}/media/#{path}?token=#{token}"
  end

  def get_s3_signed_url(filename, storage_bucket) do
    {:ok, signed_url} = ExAws.S3.presign_url(:put_object, storage_bucket, filename)
  end
end
