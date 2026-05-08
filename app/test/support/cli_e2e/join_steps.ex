defmodule Operately.Support.CliE2E.JoinSteps do
  use Operately.Support.CliE2E

  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.People.EmailActivationCode
  alias Operately.Support.CliE2E.Helpers

  @existing_account_password "hello world!"
  @new_account_password "new password 123"

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    Factory.setup(ctx)
  end

  step :use_profile, ctx, profile do
    Map.put(ctx, :profile, profile)
  end

  step :given_an_invalid_invite_token, ctx do
    Map.put(ctx, :invite_token, "invalid-token")
  end

  step :run_join_with_invalid_invite_token, ctx do
    result =
      run_cli(ctx, [
        "auth",
        "join",
        "--invite-token",
        ctx.invite_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        ctx.profile
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_invalid_invite_token_was_rejected, ctx do
    assert ctx.cli_result.exit_code == 1
    assert ctx.cli_result.output =~ "Invalid or expired invite token."

    verify_config_not_written(ctx)
  end

  step :given_a_returning_personal_invitee, ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "Returning Invitee",
        email: "returning-invitee@example.com",
        has_open_invitation: false
      )

    ctx
    |> Map.put(:invitee_account, People.get_account!(ctx.invitee.account_id))
    |> remember_expected_identity(ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  step :given_a_first_time_personal_invitee, ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "First Time Invitee",
        email: "first-time-invitee@example.com",
        has_open_invitation: true
      )

    invitee_account = People.get_account!(ctx.invitee.account_id)
    assert invitee_account.first_login_at == nil

    ctx
    |> Map.put(:invitee_account, invitee_account)
    |> remember_expected_identity(ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  step :given_a_google_personal_invitee, ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "Google Invitee",
        email: "google-invitee@example.com",
        has_open_invitation: true
      )

    ctx
    |> Map.put(:invitee_account, People.get_account!(ctx.invitee.account_id))
    |> remember_expected_identity(ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  step :given_a_personal_invite_for_the_invitee, ctx do
    invite_link = create_personal_invite_link!(ctx.company, ctx.creator, ctx.invitee)

    ctx
    |> Map.put(:invite_link, invite_link)
    |> Map.put(:invite_token, invite_link.token)
  end

  step :join_personal_invite_as_a_returning_member_with_password, ctx do
    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          ctx.invite_token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Email:", "#{ctx.invitee.email}\n"},
          {"Password:", "#{@existing_account_password}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [{"Password:", @existing_account_password}])
  end

  step :join_personal_invite_as_a_returning_member_with_email_code, ctx do
    {:ok, activation} = EmailActivationCode.create(ctx.invitee.email)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          ctx.invite_token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"How would you like to sign in?", "2\n"},
          {"A verification code was sent to your email. Enter the code:", "#{activation.code}\n"}
        ]
      )

    Map.put(ctx, :cli_result, result)
  end

  step :join_personal_invite_as_a_first_time_member_with_password, ctx do
    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          ctx.invite_token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Password:", "#{@new_account_password}\n"},
          {"Confirm password:", "#{@new_account_password}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [
      {"Password:", @new_account_password},
      {"Confirm password:", @new_account_password}
    ])
  end

  step :start_personal_invite_google_join, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          [
            "auth",
            "join",
            "--invite-token",
            ctx.invite_token,
            "--base-url",
            ctx.cli_base_url,
            "--profile",
            ctx.profile
          ],
          script: [
            {"How would you like to sign in?", "2\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :complete_personal_invite_google_join, ctx do
    session = Helpers.wait_for_google_session!()

    Helpers.complete_mock_google_auth!(ctx, session,
      account_id: ctx.invitee_account.id,
      invite_token: ctx.invite_token
    )
  end

  step :wait_for_join_to_finish, ctx do
    result = Task.await(ctx.cli_task, 25_000)
    Map.put(ctx, :cli_result, result)
  end

  step :assert_the_cli_announces_the_personal_invitee_email, ctx do
    assert ctx.cli_result.output =~ "Joining as #{ctx.invitee.email}"
    ctx
  end

  step :assert_the_personal_invite_was_consumed, ctx do
    assert Repo.reload!(ctx.invite_link).is_active == false
    ctx
  end

  step :assert_the_invitee_account_was_marked_as_used, ctx do
    invitee_account = Repo.reload!(ctx.invitee_account)
    assert invitee_account.first_login_at != nil

    Map.put(ctx, :invitee_account, invitee_account)
  end

  step :assert_the_invitee_can_use_the_new_password, ctx do
    assert People.get_account_by_email_and_password(ctx.invitee.email, "new password 123")
    ctx
  end

  step :given_a_company_wide_invite_for_another_company, ctx do
    ctx = Factory.add_account(ctx, :inviter_account)
    ctx = Factory.add_company(ctx, :invited_company, ctx.inviter_account, name: "Invited Company")

    inviter = People.get_person!(ctx.inviter_account, ctx.invited_company)
    invite_link = create_company_wide_invite_link!(ctx.invited_company, inviter)

    ctx
    |> Map.put(:invite_link, invite_link)
    |> Map.put(:invite_token, invite_link.token)
    |> remember_expected_identity(ctx.creator.full_name, ctx.creator.email, ctx.invited_company.name)
  end

  step :given_a_company_wide_google_invite_for_another_company, ctx do
    ctx = Factory.add_account(ctx, :inviter_account)
    ctx = Factory.add_company(ctx, :invited_company, ctx.inviter_account, name: "Google Invited Company")

    inviter = People.get_person!(ctx.inviter_account, ctx.invited_company)
    invite_link = create_company_wide_invite_link!(ctx.invited_company, inviter)

    ctx
    |> Map.put(:invite_link, invite_link)
    |> Map.put(:invite_token, invite_link.token)
  end

  step :join_company_wide_invite_with_password, ctx do
    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          ctx.invite_token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"Password:", "#{@existing_account_password}\n"},
          {"Select a company:", "2\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [{"Password:", @existing_account_password}])
  end

  step :join_company_wide_invite_with_email_code, ctx do
    {:ok, activation} = EmailActivationCode.create(ctx.account.email)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          ctx.invite_token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"How would you like to sign in?", "2\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"A verification code was sent to your email. Enter the code:", "#{activation.code}\n"},
          {"Select a company:", "2\n"}
        ]
      )

    Map.put(ctx, :cli_result, result)
  end

  step :assert_the_company_selection_prompt_was_skipped, ctx do
    refute ctx.cli_result.output =~ "Select a company:"
    ctx
  end

  step :assert_the_company_wide_invite_was_used, ctx do
    assert Repo.reload!(ctx.invite_link).use_count == 1
    ctx
  end

  step :assert_the_existing_account_was_added_to_the_invited_company, ctx do
    assert People.get_person!(ctx.account, ctx.invited_company)
    ctx
  end

  step :start_company_wide_google_join_for_a_new_account, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          [
            "auth",
            "join",
            "--invite-token",
            ctx.invite_token,
            "--base-url",
            ctx.cli_base_url,
            "--profile",
            ctx.profile
          ],
          script: [
            {"How would you like to sign in?", "3\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :complete_company_wide_google_join_for_a_new_account, ctx do
    session = Helpers.wait_for_google_session!()
    new_google_email = "new-google-joiner@example.com"
    new_google_name = "New Google Joiner"

    ctx = remember_expected_identity(ctx, new_google_name, new_google_email, ctx.invited_company.name)

    Helpers.complete_mock_google_auth!(ctx, session,
      email: new_google_email,
      name: new_google_name,
      invite_token: ctx.invite_token
    )
  end

  step :assert_the_new_google_account_was_added_to_the_invited_company, ctx do
    account = People.get_account_by_email(ctx.expected_email)

    assert account
    assert People.get_person!(account, ctx.invited_company)

    ctx
  end

  step :assert_join_login_succeeded, ctx do
    verify_join_login_succeeded(ctx)
  end

  step :assert_profile_was_saved, ctx do
    verify_profile_was_saved(ctx)
  end

  step :assert_the_password_prompts_were_masked, ctx do
    Enum.each(ctx.expected_password_prompts, fn {prompt, password} ->
      assert_password_is_masked(ctx.cli_result.output, prompt, password)
    end)

    ctx
  end

  step :assert_status_command_works, ctx do
    verify_status_command_works(ctx)
  end

  step :assert_people_get_me_command_works, ctx do
    verify_people_get_me_command_works(ctx)
  end

  defp remember_expected_identity(ctx, name, email, company_name) do
    ctx
    |> Map.put(:expected_name, name)
    |> Map.put(:expected_email, email)
    |> Map.put(:expected_company_name, company_name)
  end

  defp verify_join_login_succeeded(ctx) do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "Logged in to #{ctx.cli_base_url}"
    assert ctx.cli_result.output =~ ctx.expected_name

    ctx
  end

  defp verify_profile_was_saved(ctx) do
    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", ctx.profile, "token"])

    assert config["activeProfile"] == ctx.profile
    assert is_binary(token)
    assert token != ""
    assert get_in(config, ["profiles", ctx.profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", ctx.profile, "name"]) == ctx.expected_name
    assert get_in(config, ["profiles", ctx.profile, "companyName"]) == ctx.expected_company_name

    Map.put(ctx, :saved_profile_token, token)
  end

  defp verify_status_command_works(ctx) do
    status = run_cli(ctx, ["auth", "status", "--profile", ctx.profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{ctx.profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.expected_name}"
    assert status.output =~ "Company: #{ctx.expected_company_name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"

    ctx
  end

  defp verify_people_get_me_command_works(ctx) do
    get_me = run_cli(ctx, ["people", "get_me", "--profile", ctx.profile])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "full_name"]) == ctx.expected_name
    assert get_in(payload, ["me", "email"]) == ctx.expected_email

    ctx
  end

  defp verify_config_not_written(ctx) do
    refute File.exists?(cli_config_path(ctx))
    ctx
  end

  defp create_personal_invite_link!(company, author, person) do
    {:ok, invite_link} =
      InviteLinks.create_personal_invite_link(%{
        company_id: company.id,
        author_id: author.id,
        person_id: person.id
      })

    invite_link
  end

  defp create_company_wide_invite_link!(company, author) do
    {:ok, invite_link} =
      InviteLinks.create_invite_link(%{
        company_id: company.id,
        author_id: author.id
      })

    invite_link
  end
end
