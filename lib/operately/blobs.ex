defmodule Operately.Blobs do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Blobs.Blob

  def list_blobs do
    Repo.all(Blob)
  end

  def get_blob!(id), do: Repo.get!(Blob, id)

  def create_blob(attrs \\ %{}) do
    %Blob{}
    |> Blob.changeset(attrs)
    |> Repo.insert()
  end

  def update_blob(%Blob{} = blob, attrs) do
    blob
    |> Blob.changeset(attrs)
    |> Repo.update()
  end

  def delete_blob(%Blob{} = blob) do
    Repo.delete(blob)
  end

  def change_blob(%Blob{} = blob, attrs \\ %{}) do
    Blob.changeset(blob, attrs)
  end

  @valid_dispositions [
    "inline",              # Display the file in the browser
    "attachment"           # For downloading the file
  ]

  def is_valid_disposition?(disposition) do
    disposition in @valid_dispositions
  end

  def get_signed_get_url(%Blob{} = blob, disposition) when disposition in @valid_dispositions do
    path = "#{blob.company_id}-#{blob.id}"

    case blob.storage_type do
      :s3 -> 
        # Tell the browser what filename to use when downloading the file
        #
        # readmore: 
        # - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
        # - https://elixirforum.com/t/presigned-urls-with-exaws/15708/10
        #

        #
        # It must be uri encoded twice because the first encoding is for the query params for the s3 presigned url
        # while the second encoding is for the filename in the content-disposition header
        #
        uri_encoded_filename = blob.filename |> URI.encode() |> URI.encode()

        query_params = case disposition do
          "attachment" -> [{"response-content-disposition", "attachment; filename=#{uri_encoded_filename}"}]
          "inline" -> [{"response-content-disposition", "inline; filename=#{uri_encoded_filename}"}]
          _ -> raise ArgumentError, "Invalid disposition type #{disposition}"
        end

        presigned_s3_url(:get, path, 3600, [], query_params)

      :local ->
        host = OperatelyWeb.Endpoint.url()
        path = "#{blob.company_id}-#{blob.id}"
        token = Operately.Blobs.Tokens.gen_get_token(path)

        {:ok, "#{host}/media/#{path}?token=#{token}"}
      _ ->
        {:error, "Storage type not supported"}
    end
  end

  def get_signed_upload_url(%Blob{} = blob) do
    path = "#{blob.company_id}-#{blob.id}"
    headers = [
      {"Content-Type", blob.content_type},
      {"Content-Length", Integer.to_string(blob.size)}
    ]

    case blob.storage_type do
      :s3 -> presigned_s3_url(:put, path, 3600, headers, [])

      :local ->
        host = OperatelyWeb.Endpoint.url()
        token = Operately.Blobs.Tokens.gen_upload_token(path)

        {:ok, "#{host}/media/#{path}?token=#{token}"}

      _ ->
        {:error, "Storage type not supported"}
    end
  end

  def presigned_s3_url(method, path, expires_in, headers, query_params) when method in [:get, :put] do
    host = System.get_env("OPERATELY_STORAGE_S3_HOST")
    scheme = System.get_env("OPERATELY_STORAGE_S3_SCHEME")
    port = System.get_env("OPERATELY_STORAGE_S3_PORT")
    bucket = System.get_env("OPERATELY_STORAGE_S3_BUCKET")
    region = System.get_env("OPERATELY_STORAGE_S3_REGION")
    access_key_id = System.get_env("OPERATELY_STORAGE_S3_ACCESS_KEY_ID")
    secret_access_key = System.get_env("OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY")

    port = if port == nil, do: "", else: ":#{port}"
    url = "#{scheme}://#{host}#{port}/#{bucket}/#{path}"
    time = NaiveDateTime.utc_now() |> NaiveDateTime.to_erl()
    config = %{access_key_id: access_key_id, secret_access_key: secret_access_key, region: region}

    ExAws.Auth.presigned_url(method, url, :s3, time, config, expires_in, query_params, nil, headers)
  end
end
