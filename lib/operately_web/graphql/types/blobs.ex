defmodule OperatelyWeb.Graphql.Types.Blobs do
  use Absinthe.Schema.Notation

  object :blob do
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
      if System.get_env("OPERATELY_STORAGE_TYPE") == "s3" do
        resolve fn blob, _, _ ->
          Operately.Blobs.get_s3_signed_url(blob.filename, blob.storage_bucket)
        end
      else
        resolve fn blob, _, _ ->
          {:ok, Operately.Blobs.get_singed_upload_url(blob)}
        end
      end
    end
  end
end
