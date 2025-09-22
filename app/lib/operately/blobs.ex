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
        # Use 3 hours (10800 seconds) expiration to ensure URLs remain valid
        # throughout the 2-hour cache-friendly rounding window
        presigned_s3_url(:get, path, 10800, [], query_params)

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
        # Use 3 hours (10800 seconds) expiration to ensure URLs remain valid
        # throughout the 2-hour cache-friendly rounding window
        presigned_s3_url(:put, path, 10800, headers, [])

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

  # Rounds the current time DOWN to the last 2-hour boundary for cache-friendly URLs
  # This ensures URLs remain the same within 2-hour windows, improving cacheability
  #
  # Based on: https://advancedweb.hu/cacheable-s3-signed-urls/
  #
  # The idea is to "travel back in time" so that URLs created within the same 2-hour
  # window are identical, allowing browsers and CDNs to cache them effectively.
  # For example:
  # - Request at 11:05 -> rounded down to 10:00
  # - Request at 11:59 -> rounded down to 10:00
  # - Request at 12:05 -> rounded down to 12:00
  defp cache_friendly_time do
    now = DateTime.utc_now()
    current_hour = now.hour

    # Calculate the last 2-hour boundary by rounding DOWN
    last_boundary_hour =
      case rem(current_hour, 2) do
        # If on even hour (0, 2, 4, etc.), use current hour as boundary
        0 -> current_hour
        # If on odd hour (1, 3, 5, etc.), round down to previous even hour
        1 -> current_hour - 1
      end

    # Create the rounded time at the last 2-hour boundary
    %{now | hour: last_boundary_hour, minute: 0, second: 0, microsecond: {0, 0}}
    |> DateTime.to_naive()
  end
end
