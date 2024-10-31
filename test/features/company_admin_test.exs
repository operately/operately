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
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.assert_invitation_url_is_generated()
    |> Steps.open_company_team_page()
    |> Steps.assert_new_company_member_is_listed("Michael Scott")
    |> Steps.assert_company_member_details_match_invitations(params)
    |> Steps.assert_expiration_date_is_visible_on_team_page()
  end

  @tag role: :owner
  feature "promote a person to admin", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.add_company_admin()
    |> Steps.assert_person_is_admin()
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
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_is_listed()
    |> Steps.remove_company_member()
    |> Steps.assert_member_removed()
  end

  @tag role: :member
  feature "visiting the company admin page as a member", ctx do
    ctx
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_i_see_reach_out_to_admins()
    |> Steps.assert_i_see_reach_out_to_owners()
  end

  @tag role: :admin
  feature "visiting the company admin page as an admin", ctx do
    ctx
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_i_dont_see_reach_out_to_admins()
    |> Steps.assert_i_see_reach_out_to_owners()
  end

  @tag role: :owner
  feature "visiting the company admin page as an owner", ctx do
    ctx
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_i_dont_see_reach_out_to_admins()
    |> Steps.assert_i_dont_see_reach_out_to_owners()
  end

  @tag role: :admin
  feature "rename company", ctx do
    ctx
    |> Steps.open_company_admins_page()
    |> Steps.click_rename_company()
    |> Steps.fill_in_new_company_name_and_submit()
    |> Steps.assert_company_name_is_changed()
    |> Steps.assert_company_name_is_changed_in_navbar()
    |> Steps.assert_company_feed_shows_the_company_name_change()
  end

end
