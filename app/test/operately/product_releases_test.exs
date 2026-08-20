defmodule Operately.ProductReleasesTest do
  use ExUnit.Case, async: false
  import Mock

  alias Operately.ProductReleases
  alias Operately.ProductReleases.{Cache, Fetcher}
  alias Operately.ProductReleases.Release

  @release %Release{
    id: "v1.8",
    title: "Operately v1.8 is here",
    published_at: ~U[2026-07-17 00:00:00Z],
    teaser: "Bring AI into your work."
  }

  @newer %Release{
    id: "v1.9",
    title: "Operately v1.9 is here",
    published_at: ~U[2026-08-01 00:00:00Z]
  }

  setup do
    Cache.clear()
    :ok
  end

  test "ensure_feature_enabled/1 requires the experimental feature" do
    enabled = %Operately.Companies.Company{enabled_experimental_features: [ProductReleases.feature_name()]}
    disabled = %Operately.Companies.Company{enabled_experimental_features: []}

    assert {:ok, :enabled} = ProductReleases.ensure_feature_enabled(enabled)
    assert {:error, :not_found} = ProductReleases.ensure_feature_enabled(disabled)
  end

  test "fetches on cache miss" do
    with_mock Fetcher, [], fetch: fn -> {:ok, @release} end do
      assert ProductReleases.latest() == @release
    end
  end

  test "returns a fresh cache hit without fetching" do
    assert :ok = Cache.put(@release, 60)

    with_mock Fetcher, [], fetch: fn -> flunk("expected a cache hit to skip fetch") end do
      assert ProductReleases.latest() == @release
    end
  end

  test "keeps the last successful payload when a refresh fails" do
    assert :ok = Cache.put(@release, 0)

    with_mock Fetcher, [], fetch: fn -> {:error, :fetch_failed} end do
      assert ProductReleases.latest() == @release
    end
  end

  test "replaces an expired payload after a successful refresh" do
    assert :ok = Cache.put(@release, 0)

    with_mock Fetcher, [], fetch: fn -> {:ok, @newer} end do
      assert ProductReleases.latest() == @newer
      assert {:fresh, @newer} = Cache.get()
    end
  end
end
