defmodule OperatelyWeb.Api.Mutations.CreateBlob do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitError

  inputs do
    field? :files, list_of(:blob_creation_input), null: true
  end

  outputs do
    field? :blobs, list_of(:blob_creation_output), null: true
  end

  def call(conn, inputs) do
    current_company = company(conn)

    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:blobs, fn ctx -> create_blobs(ctx.me, current_company, inputs.files || []) end)
    |> run(:serialized, fn ctx -> serialize(ctx.blobs) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :blobs, %{error: :invalid_file_size}} -> {:error, :bad_request, "File size must be a non-negative integer"}
      {:error, :blobs, %{error: %LimitError{} = error}} -> EnforceLimits.to_api_error(error)
      {:error, :blobs, %LimitError{} = error} -> EnforceLimits.to_api_error(error)
      {:error, :blobs, _} -> {:error, :bad_request}
      _ -> {:error, :internal_server_error}
    end
  end

  defp create_blobs(person, company, files) do
    with {:ok, requested_delta} <- calculate_requested_delta(files),
         :ok <- Operately.Billing.check_storage_limit(company, requested_delta) do
      Repo.transaction(fn ->
        Enum.map(files, fn file ->
          {:ok, blob} = Operately.Blobs.create_blob(%{
            purpose: :company_file,
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
    end
  end

  defp calculate_requested_delta(files) do
    Enum.reduce_while(files, {:ok, 0}, fn file, {:ok, total} ->
      case normalize_file_size(file.size) do
        {:ok, size} -> {:cont, {:ok, total + size}}
        {:error, :invalid_file_size} = error -> {:halt, error}
      end
    end)
  end

  defp normalize_file_size(size) when is_integer(size) and size >= 0, do: {:ok, size}
  defp normalize_file_size(_size), do: {:error, :invalid_file_size}

  defp serialize(blobs) do
    files = Enum.map(blobs, fn blob ->
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
