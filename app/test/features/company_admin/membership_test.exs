defmodule Operately.Features.CompanyAdmin.MembershipTest do
  use Operately.FeatureCase
  use Operately.Support.Features.CompanyAdminCase

  set_app_config(:billing_enabled, true)

  @tag role: :admin
  feature "adding a new person to the company", ctx do
    params = %{
      full_name: "Michael Scott",
      email: "m.scott@dmif.com",
      title: "Regional Manager"
    }

    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.assert_invitation_url_is_generated()
    |> Steps.open_company_team_page()
    |> Steps.assert_new_company_member_is_listed("Michael Scott")
    |> Steps.assert_company_member_details_match_invitations(params)
    |> Steps.assert_expiration_date_is_visible_on_team_page()
  end

  @tag role: :member
  feature "member can't add person to company", ctx do
    ctx
    |> Steps.visit_company_admin_page()
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.assert_cannot_add_person_to_company()
  end

  @tag role: :admin
  feature "edit member's access levels", ctx do
    ctx
    |> Steps.given_a_company_owner_exists()
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_access_level_is_updated(:view_access)
    |> Steps.edit_company_member_access_level(:edit_access)
    |> Steps.assert_company_member_access_level_is_updated(:edit_access)
  end

  @tag role: :admin
  feature "edit a person's details", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.edit_company_member(%{name: "Michael Scott", new_title: "Regional Manager", new_name: "Michael G. Scott"})
    |> Steps.assert_company_member_details_updated(%{
      name: "Michael G. Scott",
      title: "Regional Manager"
    })
  end

  @tag role: :admin
  feature "convert a team member to outside collaborator", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.convert_company_member_to_guest()
    |> Steps.assert_company_member_moved_to_outside_collaborators_section()
    |> Steps.assert_company_member_converted_to_guest()
    |> Steps.assert_feed_item_notification_and_email_sent_to_converted_guest()
  end

  @tag role: :admin
  feature "remove members from the company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_is_listed()
    |> Steps.remove_company_member()
    |> Steps.assert_member_removed()
  end

  @tag role: :admin
  feature "revoke a member's invitation", ctx do
    params = %{
      full_name: "Invited Person",
      email: "invited.person@example.com",
      title: "Potential Employee"
    }

    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.open_company_team_page()
    |> Steps.assert_new_company_member_is_listed(params.full_name)
    |> Steps.revoke_member_invitation(params.full_name)
    |> Steps.assert_invitation_revoked(params)
  end

  @tag role: :admin
  feature "restore removed member", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.given_a_company_admin_exists()
    |> Steps.given_a_removed_company_member_exists()
    |> Steps.open_restore_people_page()
    |> Steps.assert_removed_person_is_listed()
    |> Steps.restore_company_member()
    |> Steps.assert_no_suspended_people_message_is_displayed()
    |> Steps.assert_member_restored()
    |> Steps.assert_feed_item_notification_and_email_sent_to_restored_member()
  end

  @tag role: :admin
  feature "restoring a removed member is blocked when the company is already full", ctx do
    ctx
    |> enable_billing_for_company()
    |> Steps.given_a_removed_company_member_exists()
    |> fill_company_to_member_limit()
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_restore_people_page()
    |> Steps.assert_removed_person_is_listed()
    |> Steps.restore_company_member()
    |> Steps.assert_limit_guidance_has_no_upgrade_cta()
    |> assert_member_still_suspended(:suspended)
  end

  @tag role: :member
  feature "member can't restore other members", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_admin_page()
    |> Steps.assert_cannot_restore_member()
  end

  @tag role: :admin
  feature "visiting the company admin page as an admin", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_i_dont_see_reach_out_to_admins()
  end
end
