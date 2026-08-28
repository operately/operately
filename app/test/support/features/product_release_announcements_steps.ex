defmodule Operately.Support.Features.ProductReleaseAnnouncementsSteps do
  use Operately.FeatureCase

  alias Operately.ProductReleases.Cache
  alias Operately.ProductReleases.Release

  @v18 %Release{
    id: "https://operately.com/releases/v180",
    title: "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more",
    published_at: ~U[2026-07-17 00:00:00Z],
    teaser: "Bring AI into your work."
  }

  @v19 %Release{
    id: "https://operately.com/releases/v190",
    title: "Operately v1.9 is here",
    published_at: ~U[2026-08-01 00:00:00Z]
  }

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  step :enable_feature, ctx do
    Factory.enable_feature(ctx, "product_release_announcements")
  end

  step :given_a_cached_release, ctx do
    Cache.put(@v18, 60)
    ctx
  end

  step :given_a_newer_cached_release, ctx do
    Cache.put(@v19, 60)
    ctx
  end

  step :visit_company_home, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.assert_has(testid: "company-home")
  end

  step :assert_toast_visible, ctx do
    ctx
    |> UI.wait_until_testid(testid: "product-release-toast")
    |> UI.assert_has(testid: "product-release-toast")
    |> UI.assert_text(@v18.title)
  end

  step :assert_newer_toast_visible, ctx do
    ctx
    |> UI.wait_until_testid(testid: "product-release-toast")
    |> UI.assert_has(testid: "product-release-toast")
    |> UI.assert_text(@v19.title)
  end

  step :refute_toast_visible, ctx do
    UI.refute_has(ctx, testid: "product-release-toast")
  end

  step :dismiss_toast, ctx do
    ctx
    |> UI.wait_until_testid(testid: "product-release-toast-dismiss")
    |> UI.click(testid: "product-release-toast-dismiss")
  end
end
