defmodule Operately.Blobs.SignedUrls do
  def get_signed_get_url(blob = %Operately.Blobs.Blob{}, disposition) do
    handler(blob).get_signed_get_url(blob, disposition)
  end

  def get_signed_upload_url(blob = %Operately.Blobs.Blob{}) do
    handler(blob).get_signed_upload_url(blob)
  end

  def handler(blob) do
    case blob.storage_type do
      :s3 -> Operately.Blobs.SignedUrls.S3
      :local -> Operately.Blobs.SignedUrls.Local
      _ -> raise ArgumentError, "Unknown storage type #{inspect(blob.storage_type)}"
    end
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

  defmodule Local do
    alias Operately.Blobs.Blob

    def get_signed_get_url(%Blob{} = blob, disposition) do
      validate_disposition!(disposition)

      host = OperatelyWeb.Endpoint.url()
      path = Blob.path(blob)
      token = Operately.Blobs.Tokens.gen_get_token(path)
      filename = URI.encode_www_form(blob.filename)

      {:ok, "#{host}/media/#{path}?token=#{token}&disposition=#{disposition}&filename=#{filename}"}
    end

    def get_signed_upload_url(%Blob{} = blob) do
      path = Blob.path(blob)
      host = OperatelyWeb.Endpoint.url()
      token = Operately.Blobs.Tokens.gen_upload_token(path)

      {:ok, "#{host}/media/#{path}?token=#{token}"}
    end

    def validate_disposition!(disposition) do
      unless Operately.Blobs.SignedUrls.is_valid_disposition?(disposition) do
        raise ArgumentError, "Invalid disposition type #{disposition}"
      end
    end
  end

  defmodule S3 do
    alias Operately.Blobs.Blob

    def get_signed_get_url(%Blob{} = blob, disposition) do
      validate_disposition!(disposition)

      path = Blob.path(blob)

      query_params = disposition_query_params(disposition, blob.filename)
      {time, expires_in} = cache_friendly_time_and_expriration()

      presigned_s3_url(:get, path, time, expires_in, [], query_params)
    end

    def get_signed_upload_url(%Blob{} = blob) do
      path = Blob.path(blob)

      time = NaiveDateTime.utc_now() |> NaiveDateTime.to_erl()
      expires_in = 3600

      headers = [
        {"Content-Type", blob.content_type},
        {"Content-Length", Integer.to_string(blob.size)}
      ]

      presigned_s3_url(:put, path, time, expires_in, headers, [])
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

    def cache_friendly_time_and_expriration() do
      # Optimize for MAXIMUM cacheability - round to 6-hour intervals
      # This ensures URLs remain the same for 6 hours, maximizing cache hits
      # With 12-hour expiration, effective validity is 6-12 hours
      current_time = NaiveDateTime.utc_now()

      # Round to 6-hour intervals (0:00, 6:00, 12:00, 18:00)
      rounded_hour = div(current_time.hour, 6) * 6

      cache_friendly_time =
        %{current_time | hour: rounded_hour, minute: 0, second: 0, microsecond: {0, 0}}
        |> NaiveDateTime.to_erl()

      # 12 hours
      expires_in = 12 * 3600

      {cache_friendly_time, expires_in}
    end

    def presigned_s3_url(method, path, time, expires_in, headers, query_params) when method in [:get, :put] do
      alias Operately.Blobs.S3Config

      S3Config.presigned_url(method, path, headers, query_params, time: time, expires_in: expires_in)
    end

    def validate_disposition!(disposition) do
      unless Operately.Blobs.SignedUrls.is_valid_disposition?(disposition) do
        raise ArgumentError, "Invalid disposition type #{disposition}"
      end
    end
  end
end
