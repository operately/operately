defmodule Operately.Features.ProductReleaseAnnouncementsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProductReleaseAnnouncementsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "does not show the toast when the experimental feature is disabled", ctx do
    ctx
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.refute_toast_visible()
  end

  feature "shows the toast when the feature is enabled", ctx do
    ctx
    |> Steps.enable_feature()
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.assert_toast_visible()
  end

  feature "dismissing the toast hides it after reload", ctx do
    ctx
    |> Steps.enable_feature()
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.assert_toast_visible()
    |> Steps.dismiss_toast()
    |> Steps.refute_toast_visible()
    |> Steps.visit_company_home()
    |> Steps.refute_toast_visible()
  end

  feature "a newer release shows the toast again", ctx do
    ctx
    |> Steps.enable_feature()
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.dismiss_toast()
    |> Steps.given_a_newer_cached_release()
    |> Steps.visit_company_home()
    |> Steps.assert_newer_toast_visible()
  end

  feature "shows the latest release in Help and Company Admin", ctx do
    ctx
    |> Steps.enable_feature()
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.open_help_dropdown()
    |> Steps.assert_help_current_release_visible()
    |> Steps.visit_company_admin()
    |> Steps.assert_admin_current_release_visible()
  end

  feature "hides Help and Admin release info when the feature is disabled", ctx do
    ctx
    |> Steps.given_a_cached_release()
    |> Steps.visit_company_home()
    |> Steps.open_help_dropdown()
    |> Steps.refute_help_current_release_visible()
    |> Steps.visit_company_admin()
    |> Steps.refute_admin_current_release_visible()
  end
end
