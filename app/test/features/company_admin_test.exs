defmodule Operately.Features.CompanyAdminTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_i_am_logged_in(as: ctx[:role])
  end

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

  @tag role: :member
  feature "member gets 404 when manually navigates to manage-people page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_manage_people_page()
    |> Steps.assert_404()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to invite-people page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_invite_people_page()
    |> Steps.assert_404()
  end

  describe "form validation" do
    @tag role: :admin
    feature "missing full name", ctx do
      params = %{
        full_name: "",
        email: "m.scott@dmif.com",
        title: "Regional Manager"
      }
      error = "Name is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "",
        title: "Regional Manager"
      }
      error = "Email is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing title", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott@dmif.com",
        title: ""
      }
      error = "Title is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "invalid email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott",
        title: "Regional Manager"
      }
      error = "Enter a valid email address"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end
  end
end
