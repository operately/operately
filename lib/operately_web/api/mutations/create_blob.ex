defmodule OperatelyWeb.Api.Mutations.CreateBlob do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :filename, :string
  end

  outputs do
    field :id, :string
    field :url, :string
    field :signed_upload_url, :string
    field :storage_type, :string
  end

  def call(conn, inputs) do
    person = me(conn)

    {:ok, blob} = Operately.Blobs.create_blob(%{
      company_id: person.company_id,
      author_id: person.id,
      status: :pending,
      filename: inputs.filename,
      storage_type: storage_type()
    })

    {:ok, url} = Operately.Blobs.get_signed_upload_url(blob)

    {:ok, %{
      id: blob.id,
      url: "/blobs/#{blob.id}",
      signed_upload_url: url,
      storage_type: blob.storage_type
    }}
  end

  defp storage_type do
    case System.get_env("OPERATELY_STORAGE_TYPE") do
      "s3" -> :s3
      "local" -> :local
      _ -> raise "OPERATELY_STORAGET_TYPE must be set to 's3' or 'local'"
    end
  end
end
