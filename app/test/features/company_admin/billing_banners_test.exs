defmodule Operately.Features.CompanyAdmin.BillingBannersTest do
  use Operately.FeatureCase
  use Operately.Support.Features.CompanyAdminCase

  set_app_config(:billing_enabled, true)

  @tag role: :owner
  feature "near-limit usage does not show a company billing banner", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_to_near_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.refute_company_billing_banner_visible()
  end

  @tag role: :member
  feature "regular members see a blocked member-limit danger banner without a CTA", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Contact a company admin or owner.")
  end

  @tag role: :member
  feature "regular members see a blocked storage-limit danger banner without a CTA", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Contact a company admin or owner.")
  end

  @tag role: :owner
  feature "owner sees an urgent over-limit banner when the company is over the member limit", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.follow_company_billing_banner_upgrade_cta()
  end

  @tag role: :admin
  feature "company admin sees an urgent over-limit banner with a CTA when storage is over the limit", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
  end

  @tag role: :owner
  feature "mixed blocked and near-limit states show one urgent banner with both rows", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> fill_company_to_near_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Active members:")
    |> Steps.assert_company_billing_banner_text("Storage used:")
  end
end
