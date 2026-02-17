defmodule Operately.Support.Features.InviteLinksSteps do
  use Operately.FeatureCase

  alias Operately.Companies
  alias Operately.Groups
  alias Operately.PeopleFixtures
  alias Operately.Support.Factory
  alias Operately.Access.Binding
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
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    Map.put(ctx, :invite_link, invite_link)
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

  step :given_logged_in_user_is_not_admin, ctx do
    ctx
    |> Factory.add_company_member(:member)
    |> Factory.set_company_access_level(:member, Binding.edit_access())
    |> Factory.log_in_person(:member)
  end

  step :given_logged_in_user_is_admin, ctx do
    ctx
    |> Factory.add_company_member(:admin)
    |> Factory.set_company_access_level(:admin, Binding.admin_access())
    |> Factory.log_in_person(:admin)
  end

  step :assert_user_has_edit_access_level, ctx do
    company = Operately.Companies.Company.get!(ctx.member, id: ctx.company.id)
    assert company.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_user_has_admin_access_level, ctx do
    company = Operately.Companies.Company.get!(ctx.admin, id: ctx.company.id)
    assert company.request_info.access_level == Binding.admin_access()

    ctx
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

  step :assert_invalid_invite_link_message, ctx do
    ctx |> UI.assert_text("Invalid Link")
  end

  step :visit_invite_team_page, ctx do
    UI.visit(ctx, Paths.company_invite_team_path(ctx.company))
  end

  step :open_invite_team_page, ctx do
    ctx
    |> UI.visit(Paths.company_invite_team_path(ctx.company))
    |> UI.assert_has(testid: "invite-team-page")
    |> UI.sleep(500)
  end

  step :assert_invite_link_visible, ctx do
    {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
    expected_url = OperatelyWeb.Endpoint.url() <> "/join/#{link.token}"

    ctx
    |> UI.click(testid: "invite-people-copy-link")
    |> UI.assert_has(testid: "invite-people-invite-link", value: expected_url)
  end

  step :capture_current_invite_token, ctx do
    {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
    expected_url = OperatelyWeb.Endpoint.url() <> "/join/#{link.token}"

    ctx
    |> Map.put(:original_token, link.token)
    |> Map.put(:original_url, expected_url)
  end

  step :assert_invite_link_on_page, ctx do
    {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
    expected_url = OperatelyWeb.Endpoint.url() <> "/join/#{link.token}"

    ctx
    |> UI.assert_has(testid: "invite-people-invite-link", value: expected_url)
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

  step :assert_invite_link_token_changed, ctx do
    attempts(ctx, 5, fn ->
      {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
      assert link.token != ctx.original_token, "Token should have changed after reset"
      assert link.is_active, "Link should still be active after reset"

      new_url = OperatelyWeb.Endpoint.url() <> "/join/#{link.token}"
      assert new_url != ctx.original_url, "URL should have changed after reset"
    end)

    ctx
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
    |> UI.send_keys([:enter])
  end

  step :assert_allowed_domains, ctx, expected_domains do
    attempts(ctx, 5, fn ->
      {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
      assert link.allowed_domains == expected_domains
    end)

    ctx
  end

  step :assert_invite_link_is_active, ctx do
    {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
    assert link.is_active
    ctx
  end

  step :disable_invite_link, ctx do
    UI.click(ctx, testid: "invite-people-link-toggle")
  end

  step :assert_invite_link_is_not_active, ctx do
    {:ok, link} = Operately.InviteLinks.get_invite_link(ctx.company.id)
    refute link.is_active
    ctx
  end

  step :given_email_delivery_is_not_configured, ctx do
    original_app_env = Application.get_env(:operately, :app_env)
    original_sendgrid = System.get_env("SENDGRID_API_KEY")
    original_smtp = System.get_env("SMTP_SERVER")

    Application.put_env(:operately, :app_env, :prod)
    System.delete_env("SENDGRID_API_KEY")
    System.delete_env("SMTP_SERVER")

    on_exit(fn ->
      Application.put_env(:operately, :app_env, original_app_env)
      if original_sendgrid, do: System.put_env("SENDGRID_API_KEY", original_sendgrid)
      if original_smtp, do: System.put_env("SMTP_SERVER", original_smtp)
    end)

    ctx
  end

  step :attempt_sign_up_with_email, ctx do
    email = PeopleFixtures.unique_account_email()
    ctx = Map.put(ctx, :new_member_email, email)

    ctx
    |> UI.click(testid: "sign-up-with-email")
    |> UI.fill(testid: "email", with: email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
    |> UI.sleep(500)
  end

  step :assert_email_delivery_not_configured_error, ctx do
    ctx
    |> UI.assert_text("Email signup isn't available because email delivery hasn't been configured. Please contact your organization administrator.")
  end

  step :assert_404, ctx do
    ctx
    |> UI.assert_text("404")
    |> UI.assert_text("Page Not Found")
  end

  defp wait_for_signup_code(email) do
    subject = "Operately confirmation code:"
    emails = Emails.wait_for_email_for(email, attempts: 10)

    email = Enum.find(emails, fn email -> String.contains?(email.subject, subject) end)
    String.split(email.subject, subject) |> List.last()
  end
end
