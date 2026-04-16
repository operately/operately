defmodule OperatelyWeb.Api.Mutations.MarkBlobUploaded do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Blobs
  alias Operately.Blobs.Blob

  inputs do
    field :blob_id, :id, null: false
  end

  outputs do
    field :blob, :blob, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:blob, fn -> fetch_blob(inputs.blob_id) end)
    |> run(:permissions, fn ctx -> authorize(ctx.blob, ctx.me) end)
    |> run(:updated_blob, fn ctx -> mark_uploaded(ctx.blob) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{blob: Serializer.serialize(ctx.updated_blob)}}
      {:error, :blob, %{error: :not_found}} -> {:error, :not_found}
      {:error, :permissions, %{error: :forbidden}} -> {:error, :forbidden}
      {:error, :updated_blob, %{error: :invalid_status}} -> {:error, :bad_request, "Blob cannot be marked as uploaded from its current state"}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_blob(id) do
    case Repo.get(Blob, id) do
      nil -> {:error, :not_found}
      blob -> {:ok, blob}
    end
  end

  defp authorize(blob, person) do
    if blob.author_id == person.id do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end

  defp mark_uploaded(%Blob{status: :pending} = blob), do: Blobs.update_blob(blob, %{status: :uploaded})
  defp mark_uploaded(%Blob{status: :uploaded} = blob), do: {:ok, blob}
  defp mark_uploaded(%Blob{}), do: {:error, :invalid_status}
end
