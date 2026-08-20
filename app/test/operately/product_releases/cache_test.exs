defmodule Operately.ProductReleases.CacheTest do
  use ExUnit.Case, async: false

  alias Operately.ProductReleases.Cache
  alias Operately.ProductReleases.Release

  @release %Release{
    id: "v1.8",
    title: "Operately v1.8 is here",
    published_at: ~U[2026-07-17 00:00:00Z],
    teaser: "Bring AI into your work."
  }

  setup do
    Cache.clear()
    :ok
  end

  test "returns a cached release before expiry" do
    assert :ok = Cache.put(@release, 60)
    assert {:fresh, @release} = Cache.get()
  end

  test "returns miss when empty" do
    assert :miss = Cache.get()
  end

  test "returns expired after ttl elapses" do
    assert :ok = Cache.put(@release, 0)
    assert {:expired, @release} = Cache.get()
  end

  test "clear removes the cached release" do
    assert :ok = Cache.put(@release, 60)
    assert :ok = Cache.clear()
    assert :miss = Cache.get()
  end
end
