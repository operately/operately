defmodule Operately.Features.CompanyAdmin.BillingBannersTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps

  setup ctx, do: Steps.setup(ctx, as: ctx[:role])

  set_app_config(:billing_enabled, true)

  @tag role: :owner
  feature "billing notice banner appears on company home and admin pages for flagged companies", ctx do
    ctx
    |> Steps.enable_billing_notice_for_company()
    |> Steps.visit_company_home_page()
    |> Steps.assert_billing_notice_banner_visible()
    |> Steps.assert_billing_notice_banner_text("New billing and plans are coming to Operately")
    |> Steps.assert_billing_notice_banner_text("You'll be able to review plan options, usage, and billing details in Company Administration.")
    |> Steps.visit_company_admin_page()
    |> Steps.assert_billing_notice_banner_visible()
    |> Steps.assert_billing_notice_banner_text("No action is required today.")
  end

  @tag role: :owner
  feature "dismissing the billing notice banner hides it across pages and flagged companies", ctx do
    ctx
    |> Steps.enable_billing_notice_for_company()
    |> Steps.given_another_company_with_billing_notice_exists()
    |> Steps.visit_company_home_page()
    |> Steps.assert_billing_notice_banner_visible()
    |> Steps.dismiss_billing_notice_banner()
    |> Steps.assert_billing_notice_dismissed_in_local_storage()
    |> Steps.visit_company_admin_page()
    |> Steps.refute_billing_notice_banner_visible()
    |> Steps.visit_company_home_page_for_company(:second_company)
    |> Steps.refute_billing_notice_banner_visible()
  end

  @tag role: :owner
  feature "companies without the billing-notice feature do not show the billing notice banner", ctx do
    ctx
    |> Steps.visit_company_home_page()
    |> Steps.refute_billing_notice_banner_visible()
    |> Steps.visit_company_admin_page()
    |> Steps.refute_billing_notice_banner_visible()
  end

  @tag role: :owner
  feature "near-limit usage does not show a company billing banner", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_to_near_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.refute_company_billing_banner_visible()
  end

  @tag role: :member
  feature "regular members see a blocked member-limit danger banner without a CTA", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Adding or restoring people is paused")
    |> Steps.assert_company_billing_banner_text("Contact an admin or owner.")
  end

  @tag role: :member
  feature "regular members see a blocked storage-limit danger banner without a CTA", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Uploading files is paused")
    |> Steps.assert_company_billing_banner_text("Contact an admin or owner.")
  end

  @tag role: :owner
  feature "owner sees an urgent over-limit banner when the company is over the member limit", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Review billing")
    |> Steps.follow_company_billing_banner_upgrade_cta()
  end

  @tag role: :admin
  feature "company admin sees an urgent over-limit banner with a CTA when storage is over the limit", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Review billing")
  end

  @tag role: :owner
  feature "mixed blocked and near-limit states show one urgent banner with both rows", ctx do
    ctx
    |> Steps.enable_billing_for_company()
    |> Steps.fill_company_beyond_member_limit()
    |> Steps.fill_company_to_near_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Adding or restoring people is paused")
    |> Steps.assert_company_billing_banner_text("Active members:")
    |> Steps.assert_company_billing_banner_text("Storage used:")
  end
end
