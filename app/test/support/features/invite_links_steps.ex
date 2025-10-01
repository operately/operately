defmodule Operately.Support.Features.InviteLinksSteps do
  use Operately.FeatureCase

  alias Operately.PeopleFixtures
  alias Operately.Support.Factory
  alias Operately.Support.Features.UI.Emails, as: Emails

  step :setup, ctx do
    ctx |> Factory.setup()
  end

  step :given_the_invited_member_is_logged_in, ctx do
    # create a new company context and log in the invited member
    ctx2 = Factory.setup(ctx)
    ctx2 = Factory.add_company_member(ctx2, :invited)
    ctx2 = Factory.log_in_person(ctx2, :invited)

    Map.put(ctx, :invited, ctx2.invited)
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
    email = "hello@test.localhost"

    ctx = Map.put(ctx, :expected_member_email, email)

    ctx
    |> UI.click(testid: "sign-up-with-email")
    |> UI.fill(testid: "email", with: email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
    |> then(fn ctx ->
      emails = Emails.wait_for_email_for(email, attempts: 10)

      email =
        Enum.find(emails, fn email ->
          String.contains?(email.subject, "Operately confirmation code:")
        end)

      code = String.split(email.subject, "Operately confirmation code:") |> List.last()

      ctx
      |> UI.fill(testid: "code", with: code)
      |> UI.click(testid: "submit")
    end)
    |> UI.sleep(500)
  end

  step :sign_up_with_google, ctx do
    ctx |> UI.click(testid: "sign-up-with-google")
  end

  step :assert_you_are_member_of_the_company, ctx do
    expected_email =
      cond do
        Map.has_key?(ctx, :expected_member_email) -> ctx.expected_member_email
        Map.has_key?(ctx, :invited) -> ctx.invited.email
        true -> "hello@test.localhost"
      end

    members = Operately.People.list_people(ctx.company.id)
    assert Enum.any?(members, fn member -> member.email == expected_email end)

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
    previous = Application.get_env(:operately, :allow_login_with_google)
    Application.put_env(:operately, :allow_login_with_google, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_login_with_google, previous)
    end)

    account =
      case Map.fetch(ctx, :existing_google_account) do
        {:ok, account} -> account
        :error -> PeopleFixtures.account_fixture()
      end

    ctx =
      ctx
      |> Map.put(:existing_google_account, account)
      |> Map.put(:expected_member_email, account.email)

    ctx
    |> UI.visit("/log_in?invite_token=#{ctx.invite_link.token}")
    |> UI.assert_has(testid: "sign-in-with-google")
    |> UI.visit(
      "/accounts/auth/test_google?account_id=#{account.id}&invite_token=#{ctx.invite_link.token}"
    )
    |> UI.sleep(500)
  end

  step :log_in_with_email, ctx do
    {account, ctx} =
      case Map.fetch(ctx, :existing_account) do
        {:ok, account} ->
          {account, ctx}

        :error ->
          account = PeopleFixtures.account_fixture()
          {account, Map.put(ctx, :existing_account, account)}
      end

    password = PeopleFixtures.valid_account_password()

    ctx = Map.put(ctx, :expected_member_email, account.email)

    ctx
    |> UI.assert_has(testid: "login-page")
    |> UI.fill(testid: "email", with: account.email)
    |> UI.fill(testid: "password", with: password)
    |> UI.click(testid: "submit")
    |> UI.sleep(500)
  end

  step :assert_expired_invite_link_message, ctx do
    ctx |> UI.assert_text("Expired Invitation")
  end

  step :assert_invalid_invite_link_message, ctx do
    ctx |> UI.assert_text("Invalid Link")
  end
end
