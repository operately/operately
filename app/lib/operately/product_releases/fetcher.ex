defmodule Operately.ProductReleases.Fetcher do
  @moduledoc """
  Fetches the official marketing release feed from operately.com.
  """

  alias Operately.ProductReleases.Parser

  @feed_url "https://operately.com/releases/rss.xml"
  @fetch_timeout_ms 5_000
  @max_response_bytes 512_000
  @request_headers [{"x-operately-client", "product-release-fetcher"}]

  def fetch do
    with {:ok, body} <- http_get(@feed_url) do
      Parser.parse(body)
    end
  end

  defp http_get(url) do
    case Req.get(url,
           headers: @request_headers,
           redirect: false,
           decode_body: false,
           retry: false,
           receive_timeout: @fetch_timeout_ms
         ) do
      {:ok, %{status: 200, body: body}} when is_binary(body) ->
        if byte_size(body) > @max_response_bytes do
          {:error, :invalid_response}
        else
          {:ok, body}
        end

      {:ok, %{status: _status}} ->
        {:error, :invalid_response}

      {:error, _reason} ->
        {:error, :fetch_failed}
    end
  end
end
