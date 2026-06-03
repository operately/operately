defmodule Operately.Features.CompanyBillingRecoveryTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.BillingSteps
  alias Operately.Support.Features.CompanyBillingRecoverySteps, as: RecoverySteps
  alias Operately.Support.Features.CompanyAdminSteps, as: AdminSteps

  set_app_config(:billing_enabled, true)

  setup ctx do
    ctx
    |> AdminSteps.given_a_company_exists()
    |> AdminSteps.given_i_am_logged_in(as: ctx[:role])
  end

  @tag role: :admin
  feature "manage people page keeps only allowed actions in read-only mode", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> AdminSteps.given_a_company_member_exists()
    |> RecoverySteps.add_invited_company_member(:invited_member, "Invited Memberson")
    |> RecoverySteps.add_expired_invited_company_member(:expired_invited_member, "Expired Invitee")
    |> RecoverySteps.put_company_in_payment_recovery(:read_only)
    |> AdminSteps.open_company_team_page()
    |> RecoverySteps.assert_invite_people_button_hidden()
    |> RecoverySteps.assert_read_only_actions_for_company_member()
    |> RecoverySteps.assert_reissue_invitation_action_hidden_for(:invited_member)
    |> RecoverySteps.assert_renew_invitation_action_hidden_for(:expired_invited_member)
  end

  @tag role: :owner
  feature "payment grace shows a company-wide danger banner instead of limit banners", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.fill_company_to_near_member_limit()
    |> RecoverySteps.put_company_in_payment_recovery(:payment_grace)
    |> AdminSteps.visit_company_home_page()
    |> RecoverySteps.assert_payment_default_banner_has_upgrade_cta()
    |> RecoverySteps.assert_payment_default_banner_text("Payment issue requires attention")
    |> RecoverySteps.assert_payment_default_banner_text("switch to read-only mode")
    |> AdminSteps.refute_approaching_limit_banner_visible()
    |> RecoverySteps.follow_payment_default_banner_cta()
  end

  @tag role: :admin
  feature "company admins can review billing during payment grace", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.put_company_in_payment_recovery(:payment_grace)
    |> AdminSteps.visit_company_home_page()
    |> RecoverySteps.assert_payment_default_banner_has_upgrade_cta()
    |> RecoverySteps.follow_payment_default_banner_cta()
    |> BillingSteps.assert_billing_entry_is_visible_on_company_admin_page()
  end

  @tag role: :owner
  feature "owners do not see rename or trusted email domain actions after the company becomes read-only", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.put_company_in_payment_recovery(:read_only)
    |> RecoverySteps.assert_rename_company_hidden_on_company_admin_page()
    |> RecoverySteps.assert_trusted_email_domains_hidden_on_company_admin_page()
  end

  @tag role: :member
  feature "regular members see the payment grace banner without a CTA", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.put_company_in_payment_recovery(:payment_grace)
    |> AdminSteps.visit_company_home_page()
    |> RecoverySteps.assert_payment_default_banner_has_no_upgrade_cta()
    |> RecoverySteps.assert_payment_default_banner_text("switch to read-only mode")
    |> RecoverySteps.assert_payment_default_banner_text("Contact a company admin or owner.")
  end

  @tag role: :member
  feature "regular members still see the payment banner after the company becomes read-only", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.put_company_in_payment_recovery(:read_only)
    |> AdminSteps.visit_company_home_page()
    |> RecoverySteps.assert_payment_default_banner_has_no_upgrade_cta()
    |> RecoverySteps.assert_payment_default_banner_text("This company is read-only")
    |> RecoverySteps.assert_payment_default_banner_text("company admin or owner")
  end

  @tag role: :admin
  feature "company admins can open the cancellation page during payment recovery", ctx do
    ctx
    |> RecoverySteps.enable_billing_for_company()
    |> RecoverySteps.put_company_in_payment_recovery(:payment_grace)
    |> RecoverySteps.visit_company_billing_cancel_page()
    |> BillingSteps.assert_billing_cancellation_page_is_open()
  end
end
