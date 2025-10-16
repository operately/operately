defmodule Operately.Support.Features.InviteLinksSteps do
  use Operately.FeatureCase

  alias Operately.Companies
  alias Operately.Groups
  alias Operately.PeopleFixtures
  alias Operately.Support.Factory
  alias Operately.Support.Features.UI.Emails, as: Emails

  step :given_a_company_and_a_user, ctx do
    ctx = Factory.setup(ctx)
    UI.login_as(ctx, ctx.creator)
  end

  step :open_invite_team_page, ctx do
    path = Paths.home_path(ctx.company) <> "/invite-team"

    ctx
    |> UI.visit(path)
    |> UI.assert_has(testid: "invite-team-page")
  end

  step :enable_invite_link, ctx do
    ctx
    |> UI.click(testid: "invite-people-link-toggle")
    |> UI.sleep(500)
  end

  step :assert_active_invite_link_created, ctx do
    invite_link = wait_for_active_invite_link(ctx.company.id)

    assert invite_link.author_id == ctx.creator.id
    assert invite_link.is_active

    Map.put(ctx, :invite_link, invite_link)
  end

  step :reset_invite_link, ctx do
    ctx
    |> UI.sleep(500)
    |> UI.assert_has(testid: "invite-people-reset-link")
    |> UI.click(testid: "invite-people-reset-link")
    |> UI.assert_has(testid: "invite-people-reset-confirm")
    |> UI.click_button("Generate new link")
    |> UI.sleep(500)
  end

  step :assert_invite_link_rotated, ctx do
    old_link = Operately.Repo.reload(ctx.invite_link)
    new_link = wait_for_new_active_invite_link(ctx.company.id, old_link.id)

    refute old_link.is_active
    assert new_link.is_active
    refute new_link.id == old_link.id

    Map.put(ctx, :invite_link, new_link)
  end

  step :enable_domain_restrictions, ctx do
    ctx
    |> UI.assert_has(testid: "invite-people-domain-toggle")
    |> UI.click(testid: "invite-people-domain-toggle-restricted")
    |> UI.assert_has(testid: "invite-people-domain-input")
  end

  step :set_allowed_domains, ctx, domains do
    ctx
    |> UI.fill(testid: "invite-people-domain-input-input", with: domains)
  end

  step :assert_allowed_domains, ctx, expected_domains do
    invite_link = wait_for_active_invite_link(ctx.company.id)

    assert invite_link.allowed_domains == expected_domains

    Map.put(ctx, :invite_link, invite_link)
  end

  step :setup, ctx do
    prev_allow_signup_with_email = Application.get_env(:operately, :allow_signup_with_email)
    prev_allow_login_with_email = Application.get_env(:operately, :allow_login_with_email)
    prev_allow_signup_with_google = Application.get_env(:operately, :allow_signup_with_google)
    prev_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)

    Application.put_env(:operately, :allow_signup_with_google, true)
    Application.put_env(:operately, :allow_login_with_google, true)
    Application.put_env(:operately, :allow_signup_with_email, true)
    Application.put_env(:operately, :allow_login_with_email, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_signup_with_google, prev_allow_signup_with_google)
      Application.put_env(:operately, :allow_login_with_google, prev_allow_login_with_google)
      Application.put_env(:operately, :allow_signup_with_email, prev_allow_signup_with_email)
      Application.put_env(:operately, :allow_login_with_email, prev_allow_login_with_email)
    end)

    ctx |> Factory.setup()
  end

  step :given_the_invited_member_has_an_account, ctx do
    password = "keyboardCAT123"

    # create a new company context and log in the invited member
    ctx2 = Factory.setup(ctx)
    ctx2 = Factory.add_company_member(ctx2, :invited, password: password)

    ctx
    |> Map.put(:invited, ctx2.invited)
    |> Map.put(:new_member_email, ctx2.invited.email)
    |> Map.put(:invited_member_password, password)
  end

  step :given_the_invited_member_is_logged_in, ctx do
    ctx |> Factory.log_in_person(:invited)
  end

  step :given_that_an_invite_link_exists, ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :given_that_an_expired_invite_link_exists, ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        expires_at: DateTime.add(DateTime.utc_now(), -1, :day)
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :given_that_a_revoked_invite_link_exists, ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    {:ok, revoked_link} = Operately.InviteLinks.revoke_invite_link(invite_link)

    Map.put(ctx, :invite_link, revoked_link)
  end

  step :given_that_i_have_an_invalid_invite_link, ctx do
    Map.put(ctx, :invite_link, %{token: "asdasdasd"})
  end

  step :given_the_invited_member_is_already_part_of_the_company, ctx do
    ctx = Factory.add_company_member(ctx, :invited)

    members = Operately.People.list_people(ctx.company.id)
    assert Enum.any?(members, fn member -> member.email == ctx.invited.email end)

    ctx |> Map.put(:new_member_email, ctx.invited.email)
  end

  step :follow_invite_link, ctx do
    ctx
    |> UI.visit("/join/#{ctx.invite_link.token}")
  end

  step :assert_on_join_page_with_invitation, ctx do
    ctx
    |> UI.assert_text("#{ctx.creator.full_name} invited you to join")
    |> UI.assert_text(ctx.company.name)
  end

  step :follow_join_button, ctx do
    ctx
    |> UI.click(testid: "join-company")
    |> UI.sleep(500)
  end

  step :follow_sign_up_and_join, ctx do
    ctx
    |> UI.assert_text("Sign Up & Join")
    |> UI.click(testid: "sign-up-and-join")
  end

  step :sign_up_with_email, ctx do
    email = PeopleFixtures.unique_account_email()
    ctx = Map.put(ctx, :new_member_email, email)

    ctx
    |> UI.click(testid: "sign-up-with-email")
    |> UI.fill(testid: "email", with: email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
    |> then(fn ctx ->
      code = wait_for_signup_code(email)

      ctx
      |> UI.fill(testid: "code", with: code)
      |> UI.click(testid: "submit")
      |> UI.sleep(500)
    end)
  end

  step :sign_up_with_google, ctx do
    email = PeopleFixtures.unique_account_email()
    ctx = Map.put(ctx, :new_member_email, email)

    ctx
    |> UI.visit("/sign_up?invite_token=#{ctx.invite_link.token}")
    |> UI.assert_has(testid: "sign-up-page")
    |> UI.assert_has(testid: "sign-up-with-email")
    |> UI.assert_has(testid: "sign-up-with-google")
    |> UI.visit("/accounts/auth/test_google?email=#{URI.encode_www_form(email)}&invite_token=#{ctx.invite_link.token}")
    |> UI.sleep(500)
  end

  step :assert_you_are_member_of_the_company, ctx do
    members = Operately.People.list_people(ctx.company.id)
    assert Enum.any?(members, fn member -> member.email == ctx.new_member_email end)

    ctx
  end

  step :assert_you_are_member_of_the_general_space, ctx do
    general_space = Companies.get_company_space!(ctx.company.id)
    members = Groups.list_members(general_space)

    assert Enum.any?(members, fn member -> member.email == ctx.new_member_email end)

    ctx
  end

  step :assert_you_are_redirected_to_company_home_page, ctx do
    ctx
    |> UI.assert_text(ctx.company.name)
    |> UI.assert_has(testid: "company-home")
  end

  step :follow_log_in_and_join, ctx do
    ctx
    |> UI.assert_text("Log in with your account")
    |> UI.click(testid: "log-in-and-join")
  end

  step :log_in_with_google, ctx do
    account_id = ctx.invited.account_id

    ctx
    |> Map.put(:new_member_email, ctx.invited.email)
    |> UI.visit("/log_in?invite_token=#{ctx.invite_link.token}")
    |> UI.assert_has(testid: "sign-in-with-google")
    |> UI.visit("/accounts/auth/test_google?account_id=#{account_id}&invite_token=#{ctx.invite_link.token}")
    |> UI.sleep(500)
  end

  step :log_in_with_email, ctx do
    ctx
    |> Map.put(:new_member_email, ctx.invited.email)
    |> UI.assert_has(testid: "login-page")
    |> UI.fill(testid: "email", with: ctx.invited.email)
    |> UI.fill(testid: "password", with: ctx.invited_member_password)
    |> UI.click(testid: "submit")
    |> UI.sleep(500)
  end

  step :assert_expired_invite_link_message, ctx do
    ctx |> UI.assert_text("Expired Invitation")
  end

  step :assert_invalid_invite_link_message, ctx do
    ctx |> UI.assert_text("Invalid Link")
  end

  defp wait_for_signup_code(email) do
    subject = "Operately confirmation code:"
    emails = Emails.wait_for_email_for(email, attempts: 10)

    email = Enum.find(emails, fn email -> String.contains?(email.subject, subject) end)
    String.split(email.subject, subject) |> List.last()
  end

  defp wait_for_active_invite_link(company_id, attempts \\ 30)

  defp wait_for_active_invite_link(_company_id, 0) do
    flunk("Failed to find active invite link")
  end

  defp wait_for_active_invite_link(company_id, attempts) do
    case fetch_active_invite_link(company_id) do
      nil ->
        Process.sleep(200)
        wait_for_active_invite_link(company_id, attempts - 1)

      invite_link ->
        invite_link
    end
  end

  defp wait_for_new_active_invite_link(company_id, ignore_id, attempts \\ 30)

  defp wait_for_new_active_invite_link(_company_id, _ignore_id, 0) do
    flunk("Active invite link was not rotated")
  end

  defp wait_for_new_active_invite_link(company_id, ignore_id, attempts) do
    case fetch_active_invite_link(company_id) do
      nil ->
        Process.sleep(200)
        wait_for_new_active_invite_link(company_id, ignore_id, attempts - 1)

      %{id: ^ignore_id} ->
        Process.sleep(200)
        wait_for_new_active_invite_link(company_id, ignore_id, attempts - 1)

      invite_link ->
        invite_link
    end
  end

  defp fetch_active_invite_link(company_id) do
    Operately.InviteLinks.list_invite_links_for_company(company_id)
    |> Enum.find(&(&1.is_active == true))
  end
end
