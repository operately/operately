defmodule OperatelyWeb.Api.Mutations.CreateAvatarBlob do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  @max_avatar_size 12 * 1024 * 1024

  inputs do
    field? :files, list_of(:blob_creation_input), null: true
  end

  outputs do
    field? :blobs, list_of(:blob_creation_output), null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:blobs, fn ctx -> create_blobs(ctx.me, inputs.files || []) end)
    |> run(:serialized, fn ctx -> serialize(ctx.blobs) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :blobs, %{error: :file_too_large}} ->
        {:error, :bad_request, "Avatar file is too large"}

      {:error, :blobs, _reason} ->
        {:error, :bad_request}

      _ ->
        {:error, :internal_server_error}
    end
  end

  defp create_blobs(person, files) do
    case Enum.find(files, &file_too_large?/1) do
      nil ->
        Repo.transaction(fn ->
          Enum.map(files, fn file ->
            {:ok, blob} =
              Operately.Blobs.create_blob(%{
                company_id: person.company_id,
                author_id: person.id,
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

      _ ->
        {:error, :file_too_large}
    end
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

  defp file_too_large?(%{size: size}) when is_integer(size), do: size > @max_avatar_size
  defp file_too_large?(_), do: true
end
