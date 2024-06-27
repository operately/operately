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
    field :upload_strategy, :string # "direct", "multipart"
  end

  def call(conn, inputs) do
    person = me(conn)

    {:ok, blob} = Operately.Blobs.create_blob(%{
      company_id: person.company_id,
      author_id: person.id,
      status: :pending,
      filename: inputs.filename,
    })

    {:ok, url} = Operately.Blobs.get_signed_upload_url(blob)

    {:ok, %{
      id: blob.id,
      url: Operately.Blobs.Blob.url(blob),
      signed_upload_url: url,
      upload_strategy: Operately.Blobs.Blob.upload_strategy(blob),
    }}
  end
end
