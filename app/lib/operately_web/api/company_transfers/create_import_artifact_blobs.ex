defmodule OperatelyWeb.Api.CompanyTransfers.CreateImportArtifactBlobs do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :files, list_of(:blob_creation_input), null: true
  end

  outputs do
    field? :blobs, list_of(:blob_creation_output), null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:account, fn -> find_account(conn) end)
    |> run(:blobs, fn ctx -> create_blobs(ctx.account, inputs.files || []) end)
    |> run(:serialized, fn ctx -> serialize(ctx.blobs) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :blobs, _} -> {:error, :bad_request}
      _ -> {:error, :internal_server_error}
    end
  end

  defp create_blobs(account, files) do
    Repo.transaction(fn ->
      Enum.map(files, fn file ->
        {:ok, blob} =
          Operately.Blobs.create_blob(%{
            purpose: :company_transfer_import_artifact,
            account_id: account.id,
            status: :pending,
            filename: file.filename,
            size: file.size,
            content_type: file.content_type,
            width: file[:width],
            height: file[:height]
          })

        blob
      end)
    end)
  end

  defp serialize(blobs) do
    files =
      Enum.map(blobs, fn blob ->
        {:ok, url} = Operately.Blobs.get_signed_upload_url(blob)

        %{
          id: blob.id,
          url: Operately.Blobs.Blob.url(blob),
          signed_upload_url: url,
          upload_strategy: Operately.Blobs.Blob.upload_strategy(blob)
        }
      end)

    {:ok, %{blobs: files}}
  end
end
