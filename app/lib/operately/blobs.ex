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

  defdelegate get_signed_get_url(blob, disposition), to: Operately.Blobs.SignedUrls
  defdelegate get_signed_upload_url(blob), to: Operately.Blobs.SignedUrls
  defdelegate upload_file_to_blob(company, author, file_path, content_type), to: Operately.Blobs.Upload
  defdelegate download_blob_to_file(blob, dest_path), to: Operately.Blobs.Download, as: :download
end
