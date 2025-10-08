defmodule Operately.Support.Features.InviteLinksSteps do
  use Operately.FeatureCase

  alias Operately.Companies
  alias Operately.Groups
  alias Operately.InviteLinks
  alias Operately.InviteLinks.InviteLink
  alias Operately.PeopleFixtures
  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Support.Features.UI.Emails, as: Emails

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
      InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :given_that_an_expired_invite_link_exists, ctx do
    {:ok, invite_link} =
      InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        expires_at: DateTime.add(DateTime.utc_now(), -1, :day)
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :given_that_a_revoked_invite_link_exists, ctx do
    {:ok, invite_link} =
      InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)

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

  step :given_i_am_company_admin, ctx do
    ctx
    |> Factory.add_company_admin(:admin, name: "Admin Adminson")
    |> Factory.log_in_person(:admin)
  end

  step :open_manage_people_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-team-members")
    |> UI.assert_has(testid: "manage-people-page")
  end

  step :assert_invite_link_section_visible, ctx do
    ctx
    |> UI.assert_has(testid: "invite-link-section")
    |> UI.assert_text("Invite link to add members")
  end

  step :assert_invite_link_toggle_disabled, ctx do
    ctx
    |> UI.assert_has(css: "[data-test-id='invite-link-toggle'] [role='switch'][data-state='unchecked']")
    |> UI.refute_has(testid: "invite-link-copy")
  end

  step :assert_invite_link_toggle_enabled, ctx do
    ctx
    |> UI.assert_has(css: "[data-test-id='invite-link-toggle'] [role='switch'][data-state='checked']")
    |> UI.assert_has(testid: "invite-link-copy")
  end

  step :assert_active_invite_link_exists, ctx do
    Process.sleep(100)

    active_link = fetch_active_invite_link(ctx.company.id)
    assert active_link

    Map.put(ctx, :active_invite_link, active_link)
  end

  step :assert_no_active_invite_links, ctx do
    Process.sleep(100)

    assert_no_active_invite_links_for_company(ctx.company.id)
    Map.put(ctx, :active_invite_link, nil)
  end

  step :enable_invite_link_toggle, ctx do
    ctx =
      ctx
      |> UI.click(testid: "invite-link-toggle-label")
      |> UI.assert_has(css: "[data-test-id='invite-link-toggle'] [role='switch'][data-state='checked']")
      |> UI.assert_has(testid: "invite-link-copy")

    Process.sleep(100)

    active_link = fetch_active_invite_link(ctx.company.id)
    assert active_link

    Map.put(ctx, :active_invite_link, active_link)
  end

  step :disable_invite_link_toggle, ctx do
    ctx =
      ctx
      |> UI.click(testid: "invite-link-toggle-label")
      |> UI.assert_has(css: "[data-test-id='invite-link-toggle'] [role='switch'][data-state='unchecked']")
      |> UI.refute_has(testid: "invite-link-copy")

    Process.sleep(100)

    assert_no_active_invite_links_for_company(ctx.company.id)

    if link = ctx[:active_invite_link] do
      reloaded = Repo.get!(InviteLink, link.id)
      refute InviteLink.is_valid?(reloaded)
    end

    Map.put(ctx, :active_invite_link, nil)
  end

  step :generate_new_invite_link, ctx do
    ctx =
      ctx
      |> UI.click(testid: "invite-link-generate-new")
      |> UI.assert_has(testid: "invite-link-copy")

    Process.sleep(100)

    ctx
  end

  step :assert_new_invite_link_replaces_old, ctx do
    Process.sleep(100)

    new_active = fetch_active_invite_link(ctx.company.id)
    assert new_active

    previous = ctx[:invite_link] || ctx[:active_invite_link]
    assert previous
    refute new_active.id == previous.id

    reloaded_previous = Repo.get!(InviteLink, previous.id)
    refute InviteLink.is_valid?(reloaded_previous)

    Map.put(ctx, :active_invite_link, new_active)
  end

  defp wait_for_signup_code(email) do
    subject = "Operately confirmation code:"
    emails = Emails.wait_for_email_for(email, attempts: 10)

    email = Enum.find(emails, fn email -> String.contains?(email.subject, subject) end)
    String.split(email.subject, subject) |> List.last()
  end

  defp fetch_active_invite_link(company_id) do
    company_id
    |> InviteLinks.list_invite_links_for_company()
    |> Enum.find(&InviteLink.is_valid?/1)
  end

  defp assert_no_active_invite_links_for_company(company_id) do
    links = InviteLinks.list_invite_links_for_company(company_id)
    refute Enum.any?(links, &InviteLink.is_valid?/1)
  end
end
