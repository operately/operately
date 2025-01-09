defmodule OperatelyWeb.Api.Mutations.CreateBlob do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :files, list_of(:blob_creation_input)
  end

  outputs do
    field :blobs, list_of(:blob_creation_output)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:blobs, fn ctx -> create_blobs(ctx.me, inputs.files) end)
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

  defp create_blobs(person, files) do
    Repo.transaction(fn ->
      Enum.reduce(files, [], fn file, acc ->
        {:ok, blob} = Operately.Blobs.create_blob(%{
          company_id: person.company_id,
          author_id: person.id,
          status: :pending,
          filename: file.filename,
          size: file.size,
          content_type: file.content_type,
          width: file[:width],
          height: file[:height],
        })

        [blob | acc]
      end)
    end)
  end

  defp serialize(blobs) do
    files = Enum.map(blobs, fn blob ->
      {:ok, url} = Operately.Blobs.get_signed_upload_url(blob)

      %{
        id: blob.id,
        url: Operately.Blobs.Blob.url(blob),
        signed_upload_url: url,
        upload_strategy: Operately.Blobs.Blob.upload_strategy(blob),
      }
    end)

    {:ok, %{blobs: files}}
  end
end
