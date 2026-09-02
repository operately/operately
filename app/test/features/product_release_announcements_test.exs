defmodule Operately.Features.ProductReleaseAnnouncementsTest do
  use Operately.FeatureCase
  import Mock

  alias Operately.ProductReleases.Fetcher
  alias Operately.Support.Features.ProductReleaseAnnouncementsSteps, as: Steps

  setup_with_mocks([{Fetcher, [], [fetch: fn -> {:error, :skipped} end]}], ctx) do
    Steps.setup(ctx)
  end

  feature "shows the toast when a release is available", ctx do
    ctx
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.assert_toast_visible()
  end

  feature "dismissing the toast hides it after reload", ctx do
    ctx
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.assert_toast_visible()
    |> Steps.dismiss_toast()
    |> Steps.refute_toast_visible()
    |> Steps.reload_company_home()
    |> Steps.refute_toast_visible()
  end

  feature "a newer release shows the toast again", ctx do
    ctx
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.dismiss_toast()
    |> Steps.given_a_newer_cached_release()
    |> Steps.reload_company_home()
    |> Steps.assert_newer_toast_visible()
  end
end
