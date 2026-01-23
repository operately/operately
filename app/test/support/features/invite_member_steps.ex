defmodule Operately.Support.Features.InviteMemberSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Companies
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InviteLinksFixtures

  step :given_that_a_company_and_an_admin_exists, ctx do
    company = company_fixture()
    creator = hd(Companies.list_owners(company))

    Map.merge(ctx, %{company: company, admin: creator})
  end

  step :given_that_guest_accounts_feature_is_enabled, ctx do
    {:ok, company} = Companies.enable_experimental_feature(ctx.company, "guest-accounts")
    Map.put(ctx, :company, company)
  end

  step :given_that_an_account_exists_in_another_company, ctx, attrs do
    company = company_fixture()
    person_fixture_with_account(%{company_id: company.id, email: attrs.email, full_name: attrs.fullName, has_open_invitation: false})
    ctx
  end

  step :log_in_as_admin, ctx do
    ctx |> UI.login_as(ctx.admin)
  end

  step :navigate_to_invitation_page, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "company-dropdown")
    |> UI.click(testid: "company-dropdown-company-admin")
    |> UI.click(testid: "manage-team-members")
    |> UI.click(testid: "add-person")
  end

  step :open_company_team_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-team-members")
  end

  step :invite_member, ctx, params do
    ctx
    |> UI.fill(testid: "fullname", with: params[:fullName])
    |> UI.fill(testid: "email", with: params[:email])
    |> UI.fill(testid: "title", with: params[:title])
    |> UI.click_button("Invite Member")
  end

  step :invite_collaborator, ctx, params do
    ctx
    |> UI.fill(testid: "fullname", with: params[:fullName])
    |> UI.fill(testid: "email", with: params[:email])
    |> UI.fill(testid: "title", with: params[:title])
    |> UI.click_button("Invite Collaborator")
  end

  step :select_team_member_type, ctx do
    ctx |> UI.click(testid: "select-team-member")
  end

  step :select_outside_collaborator_type, ctx do
    ctx |> UI.click(testid: "select-outside-collaborator")
  end

  step :submit_password, ctx, password do
    ctx
    |> UI.fill(testid: "password", with: password)
    |> UI.fill(testid: "passwordConfirmation", with: password)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "company-home")
    |> UI.sleep(200) # Wait for the redirect to complete
  end

  step :reissue_invitation_token, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-team-members")
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.click(testid: UI.testid(["reissue-token", Paths.person_id(person)]))
    |> UI.click(testid: "confirm-reissue")
  end

  step :assert_member_invited, ctx do
    ctx |> UI.assert_text("/join?token=")
  end

  step :assert_guest_invited_email_sent, ctx, email do
    person = Operately.People.get_person_by_email(ctx.company, email)
    assert person

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.company.name,
      to: person,
      author: ctx.admin,
      action: "invited you as an outside collaborator"
    })
  end

  step :assert_member_added, ctx, name do
    ctx |> UI.assert_text("#{name} has been added")
  end

  step :given_that_I_was_invited_and_have_a_token, ctx, params do
    member =
      person_fixture_with_account(%{
        company_id: ctx.company.id,
        full_name: params[:name],
        email: params[:email],
        has_open_invitation: true
      })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})
    token = invite_link.token

    ctx
    |> Map.put(:token, token)
    |> Map.put(:person, member)
  end

  step :given_that_an_invitation_was_sent, ctx, params do
    member = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: params[:name],
      email: params[:email],
      has_open_invitation: true
    })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})
    token = invite_link.token

    ctx
    |> Map.put(:token, token)
    |> Map.put(:person, member)
  end

  step :goto_invitation_page, ctx do
    ctx
    |> UI.logout()
    |> UI.visit("/join?token=#{ctx.token}")
    |> UI.assert_text("Welcome to Operately")
    |> UI.assert_text("Choose a password")
    |> UI.assert_text("Repeat password")
  end

  step :join_company_with_google, ctx do
    email = ctx.person.email

    ctx
    |> UI.assert_has(testid: "sign-in-with-google")
    |> UI.visit("/accounts/auth/test_google?email=#{URI.encode_www_form(email)}&invite_token=#{ctx.token}")
    |> UI.sleep(500)
  end

  step :assert_password_set_for_new_member, ctx, params do
    account = Operately.People.get_account_by_email_and_password(params[:email], params[:password])
    person = Operately.Repo.preload(account, :people).people |> hd()

    assert is_struct(account, Operately.People.Account)
    assert person.email == params[:email]

    ctx
  end

  step :assert_joined_company_via_google, ctx do
    ctx
    |> UI.assert_has(testid: "company-home")
  end

  step :given_that_an_invitation_was_sent_and_expired, ctx, params do
    member = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: params[:name],
      email: params[:email],
      has_open_invitation: true
    })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})

    {:ok, _} =
      Operately.Repo.update(
        Ecto.Changeset.change(invite_link, %{
          expires_at: DateTime.add(DateTime.utc_now(), -4, :day) |> DateTime.truncate(:second)
        })
      )

    ctx |> Map.put(:member, member)
  end

  step :assert_an_expired_warning_is_shown_on_the_team_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-team-members")
    |> UI.assert_text("Invitation Expired")
  end

  step :renew_invitation, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.click(testid: UI.testid(["renew-invitation", Paths.person_id(person)]))
    |> UI.assert_text("/join?token=")
  end

  step :assert_invitation_renewed, ctx do
    member = Operately.People.get_person!(ctx.member.id)
    member = Operately.Repo.preload(member, :invite_link)

    assert DateTime.after?(member.invite_link.expires_at, DateTime.utc_now())
  end

  step :given_that_an_invitation_will_expire_in_minutes, ctx, params do
    member = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: params[:name],
      email: params[:email],
      has_open_invitation: true
    })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})

    # Set expiration to 30 minutes from now
    {:ok, _} =
      Operately.Repo.update(
        Ecto.Changeset.change(invite_link, %{
          expires_at: DateTime.add(DateTime.utc_now(), 30, :minute) |> DateTime.truncate(:second)
        })
      )

    ctx |> Map.put(:member, member)
  end

  step :given_that_an_invitation_will_expire_in_hours, ctx, params do
    member = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: params[:name],
      email: params[:email],
      has_open_invitation: true
    })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})

    # Set expiration to 5 hours from now
    {:ok, _} =
      Operately.Repo.update(
        Ecto.Changeset.change(invite_link, %{
          expires_at: DateTime.add(DateTime.utc_now(), 5, :hour) |> DateTime.truncate(:second)
        })
      )

    ctx |> Map.put(:member, member)
  end

  step :given_that_an_invitation_will_expire_in_days, ctx, params do
    member = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: params[:name],
      email: params[:email],
      has_open_invitation: true
    })

    invite_link = personal_invite_link_fixture(%{company_id: ctx.company.id, author_id: ctx.admin.id, person_id: member.id})

    # Set expiration to 1 day from now
    {:ok, _} =
      Operately.Repo.update(
        Ecto.Changeset.change(invite_link, %{
          expires_at: DateTime.add(DateTime.utc_now(), 1, :day) |> DateTime.truncate(:second)
        })
      )

    ctx |> Map.put(:member, member)
  end

  step :assert_invitation_expires_in_minutes, ctx do
    ctx |> UI.assert_text("Expires in ")
    ctx |> UI.assert_text("minute")
  end

  step :assert_invitation_expires_in_hours, ctx do
    ctx |> UI.assert_text("Expires in ")
    ctx |> UI.assert_text("hour")
  end

  step :assert_invitation_expires_in_days, ctx do
    ctx |> UI.assert_text("Expires in ")
    ctx |> UI.assert_text("day")
  end

  step :open_invitation_link_view_for, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.click(testid: UI.testid(["view-invite-link", Paths.person_id(person)]))
  end

  step :assert_invitation_link_modal_visible, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.assert_text("Share this URL with #{person.full_name} to invite them to the company:")
    |> UI.assert_text("/join?token=")
  end
end
