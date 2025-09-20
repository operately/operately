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
    # Display the file in the browser
    "inline",
    # For downloading the file
    "attachment"
  ]

  def is_valid_disposition?(disposition) do
    disposition in @valid_dispositions
  end

  def get_signed_get_url(%Blob{} = blob, disposition) when disposition in @valid_dispositions do
    path = "#{blob.company_id}-#{blob.id}"

    case blob.storage_type do
      :s3 ->
        query_params = disposition_query_params(disposition, blob.filename)
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

  defp disposition_query_params(disposition, filename) do
    #
    # Tell the browser what filename to use when downloading the file
    #
    # readmore:
    # - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
    # - https://elixirforum.com/t/presigned-urls-with-exaws/15708/10
    #
    uri_encoded_filename = URI.encode_www_form(filename)

    case disposition do
      "attachment" -> [{"response-content-disposition", "attachment; filename=#{uri_encoded_filename}"}]
      "inline" -> [{"response-content-disposition", "inline; filename=#{uri_encoded_filename}"}]
      _ -> raise ArgumentError, "Invalid disposition type #{disposition}"
    end
  end

  def get_signed_upload_url(%Blob{} = blob) do
    path = "#{blob.company_id}-#{blob.id}"

    headers = [
      {"Content-Type", blob.content_type},
      {"Content-Length", Integer.to_string(blob.size)}
    ]

    case blob.storage_type do
      :s3 ->
        presigned_s3_url(:put, path, 3600, headers, [])

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
    time = cache_friendly_time() |> NaiveDateTime.to_erl()
    config = %{access_key_id: access_key_id, secret_access_key: secret_access_key, region: region}

    ExAws.Auth.presigned_url(method, url, :s3, time, config, expires_in, query_params, nil, headers)
  end

  # Rounds the current time up to the next 2-hour boundary for cache-friendly URLs
  # This ensures URLs remain the same within 2-hour windows while staying valid
  defp cache_friendly_time do
    now = DateTime.utc_now()
    current_hour = now.hour

    # Calculate the next 2-hour boundary
    next_boundary_hour =
      case rem(current_hour, 2) do
        # If on even hour, next boundary is 2 hours later
        0 -> current_hour + 2
        # If on odd hour, next boundary is 1 hour later
        1 -> current_hour + 1
      end

    # Handle day rollover
    {next_day, next_hour} =
      if next_boundary_hour >= 24 do
        {DateTime.add(now, 1, :day), next_boundary_hour - 24}
      else
        {now, next_boundary_hour}
      end

    # Create the rounded time at the next 2-hour boundary
    %{next_day | hour: next_hour, minute: 0, second: 0, microsecond: {0, 0}}
    |> DateTime.to_naive()
  end
end
