defmodule Operately.Mcp.ClientMetadata.CacheTest do
  use ExUnit.Case, async: false

  alias Operately.Mcp.ClientMetadata.Cache

  @url "https://client.example.com/oauth/client.json"
  @document %{"client_id" => @url, "client_name" => "Example", "redirect_uris" => ["https://client.example.com/callback"]}

  setup do
    Cache.clear()
    :ok
  end

  test "returns a cached document before expiry" do
    assert :ok = Cache.put(@url, @document, 60)
    assert {:ok, @document} = Cache.get(@url)
  end

  test "returns miss for unknown urls" do
    assert :miss = Cache.get(@url)
  end

  test "returns miss after expiry" do
    assert :ok = Cache.put(@url, @document, 1)
    Process.sleep(1_100)
    assert :miss = Cache.get(@url)
  end

  test "clear removes cached entries" do
    assert :ok = Cache.put(@url, @document, 60)
    assert :ok = Cache.clear()
    assert :miss = Cache.get(@url)
  end
end
