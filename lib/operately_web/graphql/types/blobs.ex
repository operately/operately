defmodule OperatelyWeb.GraphQL.Types.Blobs do
  use Absinthe.Schema.Notation

  object :blob do
    field :author, non_null(:person)
    field :status, non_null(:string)
    field :filename, non_null(:string)

    field :signed_upload_url, non_null(:string) do
      resolve fn blob, _, _ ->
        {:ok, Operately.Blobs.get_singed_upload_url(blob)}
      end
    end
  end
end
