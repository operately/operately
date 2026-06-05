defmodule Operately.Features.CompanyAdmin.RolesAndLimitsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.CompanyAdminCase

  set_app_config(:billing_enabled, true)

  @tag role: :owner
  feature "adding a new person is blocked when the company is already full", ctx do
    params = %{
      full_name: "Limit Blocked Member",
      email: "limit.blocked.member@example.com",
      title: "Designer"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> Steps.follow_limit_guidance_upgrade_cta()
    |> assert_no_person_added(params.email)
  end

  @tag role: :owner
  feature "reaching the member limit sends one upgrade email for the breach episode", ctx do
    first_params = %{
      full_name: "Threshold Member",
      email: "threshold.member@example.com",
      title: "Designer"
    }

    second_params = %{
      full_name: "Blocked Member",
      email: "blocked.member@example.com",
      title: "Engineer"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_one_below_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(first_params)
    |> assert_limit_reached_email(:member_count, [ctx.creator.email, ctx.owner.email])
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(second_params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> assert_limit_reached_email_sent_once(:member_count)
  end

  @tag role: :owner
  feature "inviting an outside collaborator is blocked when the company is already full", ctx do
    params = %{
      full_name: "Limit Blocked Collaborator",
      email: "limit.blocked.collaborator@example.com",
      title: "Advisor"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_outside_collaborator(params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> assert_no_person_added(params.email)
  end

  @tag role: :owner
  feature "promote a person to admin", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.add_company_admin()
    |> Steps.assert_person_is_admin()
  end

  @tag role: :admin
  feature "admins can't promote to admin", ctx do
    ctx
    |> Steps.visit_company_admin_page()
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.assert_cannot_promote_to_admin()
  end

  @tag role: :owner
  feature "demote a person from admin", ctx do
    ctx
    |> Steps.given_a_company_admin_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.remove_company_admin()
    |> Steps.refute_person_is_admin()
  end

  @tag role: :owner
  feature "add a new account owner", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.add_company_owner()
    |> Steps.assert_person_is_owner()
    |> Steps.assert_feed_item_for_new_owner()
    |> Steps.assert_notification_and_email_sent_to_new_owner()
  end

  @tag role: :owner
  feature "remove account owner", ctx do
    ctx
    |> Steps.given_a_company_owner_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.remove_company_owner()
    |> Steps.refute_person_is_owner()
    |> Steps.assert_feed_item_for_removed_owner()
    |> Steps.assert_notification_and_email_sent_to_removed_owner()
  end
end
