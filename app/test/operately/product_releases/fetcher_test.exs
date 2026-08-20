defmodule Operately.ProductReleases.FetcherTest do
  use ExUnit.Case, async: false
  import Mock

  alias Operately.ProductReleases.Fetcher

  @feed_url "https://operately.com/releases/rss.xml"

  defp fixture(name) do
    Path.join([__DIR__, "fixtures", name]) |> File.read!()
  end

  test "parses the newest item from an rss feed" do
    body = fixture("operately.xml")

    with_mock Req, [],
      get: fn @feed_url, _opts ->
        {:ok, %{status: 200, body: body}}
      end do
      assert {:ok, release} = Fetcher.fetch()
      assert release.id == "https://operately.com/releases/v180"
    end
  end

  test "returns invalid_response for non-200 responses" do
    with_mock Req, [],
      get: fn @feed_url, _opts ->
        {:ok, %{status: 404, body: ""}}
      end do
      assert {:error, :invalid_response} = Fetcher.fetch()
    end
  end

  test "returns invalid_response for oversized bodies" do
    oversized = String.duplicate("a", 512_001)

    with_mock Req, [],
      get: fn @feed_url, _opts ->
        {:ok, %{status: 200, body: oversized}}
      end do
      assert {:error, :invalid_response} = Fetcher.fetch()
    end
  end

  test "returns fetch_failed for transport errors" do
    with_mock Req, [],
      get: fn @feed_url, _opts ->
        {:error, :timeout}
      end do
      assert {:error, :fetch_failed} = Fetcher.fetch()
    end
  end

  test "returns invalid_feed for malformed xml" do
    with_mock Req, [],
      get: fn @feed_url, _opts ->
        {:ok, %{status: 200, body: fixture("malformed.xml")}}
      end do
      assert {:error, :invalid_feed} = Fetcher.fetch()
    end
  end
end
