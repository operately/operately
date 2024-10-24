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
    |> Steps.assert_company_member_is_listed("Michael Scott")
    |> Steps.assert_company_member_details_match_invitations(params)
    |> Steps.assert_expiration_date_is_visible_on_team_page()
  end

  @tag role: :owner
  feature "promote a person to admin", ctx do
    ctx
    |> Steps.given_a_company_member_exists("Michael Scott")
    |> Steps.open_company_admins_page()
    |> Steps.add_company_admin("Michael Scott")
    |> Steps.assert_person_is_admin("Michael Scott")
  end

  @tag role: :owner
  feature "demote a person from admin", ctx do
    ctx
    |> Steps.given_a_company_admin_exists("Michael Scott")
    |> Steps.open_company_admins_page()
    |> Steps.remove_company_admin("Michael Scott")
    |> Steps.refute_person_is_admin("Michael Scott")
  end

  @tag role: :admin
  feature "edit a person's details", ctx do
    ctx
    |> Steps.given_a_company_member_exists("Michael Scott")
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
    |> Steps.given_a_company_member_exists("Dwight Schrute")
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_is_listed("Dwight Schrute")
    |> Steps.remove_company_member("Dwight Schrute")
    |> Steps.assert_member_removed("Dwight Schrute")
  end

end
