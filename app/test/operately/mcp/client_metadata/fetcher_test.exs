defmodule Operately.Mcp.ClientMetadata.FetcherTest do
  use ExUnit.Case, async: false
  import Mock

  alias Operately.Mcp.ClientMetadata.{Cache, Fetcher}

  @client_id "https://client.example.com/oauth/client.json"
  @document %{
    "client_id" => @client_id,
    "client_name" => "Example MCP Client",
    "redirect_uris" => ["https://client.example.com/callback"]
  }

  setup do
    Cache.clear()
    :ok
  end

  test "returns a cached document without making an http request" do
    assert :ok = Cache.put(@client_id, @document, 60)

    with_mock Req, [],
      get: fn _url, _opts ->
        flunk("expected cache hit to skip HTTP")
      end do
      assert {:ok, @document} = Fetcher.fetch(@client_id)
    end
  end

  test "fetches, decodes, and caches a metadata document" do
    body = Jason.encode!(@document)

    with_mocks [
      {Operately.Mcp.ClientMetadata.SafeUrl, [], [validate: fn _url -> :ok end]},
      {Req, [],
       [
         get: fn _url, _opts ->
           {:ok,
            %{
              status: 200,
              body: body,
              headers: %{"cache-control" => "max-age=120"}
            }}
         end
       ]}
    ] do
      assert {:ok, @document} = Fetcher.fetch(@client_id)
      assert {:ok, @document} = Cache.get(@client_id)
    end
  end

  test "does not cache documents when max-age is zero" do
    body = Jason.encode!(@document)

    with_mocks [
      {Operately.Mcp.ClientMetadata.SafeUrl, [], [validate: fn _url -> :ok end]},
      {Req, [],
       [
         get: fn _url, _opts ->
           {:ok,
            %{
              status: 200,
              body: body,
              headers: %{"cache-control" => "max-age=0"}
            }}
         end
       ]}
    ] do
      assert {:ok, @document} = Fetcher.fetch(@client_id)
      assert :miss = Cache.get(@client_id)
    end
  end

  test "returns unsafe_url when validation fails" do
    with_mock Operately.Mcp.ClientMetadata.SafeUrl, [],
      validate: fn _url -> {:error, :unsafe_url} end do
      assert {:error, :unsafe_url} = Fetcher.fetch(@client_id)
    end
  end

  test "returns invalid_response for non-200 responses" do
    with_mocks [
      {Operately.Mcp.ClientMetadata.SafeUrl, [], [validate: fn _url -> :ok end]},
      {Req, [], [get: fn _url, _opts -> {:ok, %{status: 404, body: "", headers: %{}}} end]}
    ] do
      assert {:error, :invalid_response} = Fetcher.fetch(@client_id)
    end
  end

  test "returns invalid_response for invalid json" do
    with_mocks [
      {Operately.Mcp.ClientMetadata.SafeUrl, [], [validate: fn _url -> :ok end]},
      {Req, [], [get: fn _url, _opts -> {:ok, %{status: 200, body: "not-json", headers: %{}}} end]}
    ] do
      assert {:error, :invalid_response} = Fetcher.fetch(@client_id)
    end
  end

  test "returns fetch_failed for transport errors" do
    with_mocks [
      {Operately.Mcp.ClientMetadata.SafeUrl, [], [validate: fn _url -> :ok end]},
      {Req, [], [get: fn _url, _opts -> {:error, :timeout} end]}
    ] do
      assert {:error, :fetch_failed} = Fetcher.fetch(@client_id)
    end
  end
end
