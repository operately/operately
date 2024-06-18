defmodule OperatelyWeb.Graphql.Types.Blobs do
  use Absinthe.Schema.Notation

  object :blob do
    field :id, non_null(:id)
    field :author, non_null(:person)
    field :status, non_null(:string)
    field :filename, non_null(:string)
    field :storage_type, :string

    field :url, non_null(:string) do
      resolve fn blob, _, _ ->
        {:ok, "/blobs/#{blob.id}"}
      end
    end

    field :signed_upload_url, non_null(:string) do
      resolve fn blob, _, _ ->
        Operately.Blobs.get_singed_upload_url(blob)
      end
    end
  end
end
