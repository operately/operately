defmodule Operately.Features.InviteMemberTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InvitationsFixtures

  alias Operately.Companies
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.InviteMemberSteps, as: Steps

  setup ctx do
    company = company_fixture()
    creator = hd(Companies.list_admins(company.id))

    admin = person_fixture_with_account(%{company_id: company.id, full_name: "John Admin"})
    Companies.add_admin(creator, admin.id)

    Map.merge(ctx, %{company: company, admin: admin})
  end

  @new_member %{
    newTokenTestId: "new-token-john-doe",
    fullName: "John Doe",
    email: "john@some-company.com",
    title: "Developer",
    password: "Aa12345#&!123",
  }

  feature "admin account can invite members", ctx do
    ctx
    |> UI.login_as(ctx.admin)
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(@new_member)
    |> Steps.assert_member_invited()
  end

  feature "following invitation link and choosing password", ctx do
    member = person_fixture_with_account(%{company_id: ctx.company.id, full_name: @new_member[:fullName], email: @new_member[:email]})
    invitation = invitation_fixture(%{member_id: member.id, admin_id: ctx.admin.id})
    token = invitation_token_fixture_unhashed(invitation.id)

    ctx
    |> Steps.goto_invitation_page(%{token: token})
    |> Steps.assert_invitation_form()
    |> Steps.submit_password(@new_member[:password])
    |> Steps.assert_password_set_for_new_member(@new_member)
  end

  feature "new member invitation errors", ctx do
    person_fixture_with_account(%{company_id: ctx.company.id, full_name: @new_member[:fullName], email: @new_member[:email]})

    name_missing = Map.put(@new_member, :fullName, " ")
    email_missing = Map.put(@new_member, :email, " ")
    title_missing = Map.put(@new_member, :title, " ")

    ctx
    |> UI.login_as(ctx.admin)
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(name_missing)
    |> UI.assert_text("Full name is required")
    |> Steps.invite_member(email_missing)
    |> UI.assert_text("Email is required")
    |> UI.assert_text("Email must have the @ sign and no spaces")
    |> Steps.invite_member(title_missing)
    |> UI.assert_text("Title is required")
    |> Steps.invite_member(@new_member)
    |> UI.assert_text("Email has already been taken")
  end

  feature "admin can reissue tokens", ctx do
    ctx
    |> UI.login_as(ctx.admin)
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(@new_member)
    |> Steps.assert_member_invited()
    |> UI.click(testid: "manage-people-link")
    |> Steps.reissue_invitation_token(@new_member)
    |> Steps.assert_member_invited()
  end
end
