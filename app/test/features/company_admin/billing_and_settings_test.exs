defmodule Operately.Features.CompanyAdmin.BillingAndSettingsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.CompanyAdminCase

  set_app_config(:billing_enabled, true)

  @tag role: :owner
  feature "adding a trusted email domain", ctx do
    ctx
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.add_trusted_email_domain("@dmif.com")
    |> Steps.assert_trusted_email_domain_added("@dmif.com")
  end

  @tag role: :owner
  feature "removing a trusted email domain", ctx do
    ctx
    |> Steps.given_the_company_has_trusted_email_domains(["@dmif.com"])
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.remove_trusted_email_domain("@dmif.com")
    |> Steps.assert_truested_email_domain_list_empty()
  end

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

  @tag role: :admin
  feature "rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_admins_page()
    |> Steps.click_rename_company()
    |> Steps.fill_in_new_company_name_and_submit()
    |> Steps.assert_company_name_is_changed()
    |> Steps.assert_company_name_is_changed_in_navbar()
    |> Steps.assert_company_feed_shows_the_company_name_change()
  end

  @tag role: :member
  feature "member can't rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_admin_page()
    |> Steps.assert_rename_company_not_visible()
  end

  @tag role: :owner
  feature "Delete company", ctx do
    ctx
    |> Steps.add_second_company_with_resources()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.click_delete_company()
    |> Steps.confirm_delete_company()
    |> Steps.assert_redirected_to_lobby()
    |> Steps.assert_company_is_deleted()
    |> Steps.assert_other_company_is_intact()
  end

  @tag role: :admin
  feature "Admin cannot see delete company option", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_delete_company_not_visible()
  end
end
