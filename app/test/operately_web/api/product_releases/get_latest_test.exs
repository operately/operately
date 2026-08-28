defmodule OperatelyWeb.Api.ProductReleases.GetLatestTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.ProductReleases.{Cache, Fetcher}
  alias Operately.ProductReleases.Release

  @release %Release{
    id: "v1.8",
    title: "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more",
    published_at: ~U[2026-07-17 00:00:00Z],
    teaser: "Bring AI into your work."
  }

  @release_with_version %Release{
    id: "https://operately.com/releases/v190",
    version: "1.9.0",
    title: "Operately v1.9 is here",
    published_at: ~U[2026-08-01 00:00:00Z],
    teaser: "New features."
  }

  setup do
    Cache.clear()
    on_exit(fn -> Cache.clear() end)
    :ok
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:product_releases, :get_latest], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("product_release_announcements")
      |> Factory.log_in_person(:creator)
    end

    test "returns not found while the experimental feature is disabled", ctx do
      ctx = Factory.disable_feature(ctx, "product_release_announcements")

      assert {404, _} = query(ctx.conn, [:product_releases, :get_latest], %{})
    end

    test "returns null when the cache is empty", ctx do
      with_mock Fetcher, [], fetch: fn -> {:ok, nil} end do
        assert {200, %{product_release: nil}} = query(ctx.conn, [:product_releases, :get_latest], %{})
      end
    end

    test "returns the cached release", ctx do
      assert :ok = Cache.put(@release, 60)

      with_mock Fetcher, [], fetch: fn -> flunk("expected a cache hit to skip fetch") end do
        assert {200, %{product_release: returned}} = query(ctx.conn, [:product_releases, :get_latest], %{})

        assert returned.id == "v1.8"
        assert returned.title == @release.title
        assert returned.published_at == "2026-07-17T00:00:00Z"
        assert returned.teaser == @release.teaser
        assert returned.version == nil
      end
    end

    test "serializes version when the cached release has one", ctx do
      assert :ok = Cache.put(@release_with_version, 60)

      with_mock Fetcher, [], fetch: fn -> flunk("expected a cache hit to skip fetch") end do
        assert {200, %{product_release: returned}} = query(ctx.conn, [:product_releases, :get_latest], %{})

        assert returned.id == @release_with_version.id
        assert returned.version == "1.9.0"
        assert returned.title == @release_with_version.title
      end
    end
  end
end
