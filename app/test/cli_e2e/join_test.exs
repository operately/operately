defmodule Operately.CliE2E.JoinTest do
  use Operately.CliE2ECase

  import Ecto.Query

  @moduletag ownership_timeout: 60_000

  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.People.CliAuthSession

  setup ctx do
    previous_allow_login_with_email = Application.get_env(:operately, :allow_login_with_email)
    previous_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)

    Application.put_env(:operately, :allow_login_with_email, true)
    Application.put_env(:operately, :allow_login_with_google, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_login_with_email, previous_allow_login_with_email)
      Application.put_env(:operately, :allow_login_with_google, previous_allow_login_with_google)
    end)

    {:ok, Factory.setup(ctx)}
  end

  test "join rejects invalid invite tokens", ctx do
    result =
      run_cli(ctx, [
        "auth",
        "join",
        "--invite-token",
        "invalid-token",
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "join-invalid"
      ])

    assert result.exit_code == 1
    assert result.output =~ "Invalid or expired invite token."

    refute File.exists?(cli_config_path(ctx))
  end

  test "personal invite joins a returning member with password and status works", ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "Returning Invitee",
        email: "returning-invitee@example.com",
        has_open_invitation: false
      )

    invite_link = create_personal_invite_link!(ctx.company, ctx.creator, ctx.invitee)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          invite_link.token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          "personal-password-returning"
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Is this your first time logging in?", "2\n"},
          {"Email:", "#{ctx.invitee.email}\n"},
          {"Password:", "hello world!\n"}
        ]
      )

    assert result.exit_code == 0
    assert result.output =~ "Joining as #{ctx.invitee.email}"

    assert Repo.reload!(invite_link).is_active == false

    assert_joined_profile(ctx, "personal-password-returning", ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  test "personal invite lets a first-time member set a password and status works", ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "First Time Invitee",
        email: "first-time-invitee@example.com",
        has_open_invitation: true
      )

    invitee_account = People.get_account!(ctx.invitee.account_id)
    assert invitee_account.first_login_at == nil

    invite_link = create_personal_invite_link!(ctx.company, ctx.creator, ctx.invitee)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          invite_link.token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          "personal-password-first-time"
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Is this your first time logging in?", "1\n"},
          {"Password:", "new password 123\n"},
          {"Confirm password:", "new password 123\n"}
        ]
      )

    assert result.exit_code == 0
    assert Repo.reload!(invite_link).is_active == false

    invitee_account = Repo.reload!(invitee_account)
    assert invitee_account.first_login_at != nil
    assert People.get_account_by_email_and_password(ctx.invitee.email, "new password 123")

    assert_joined_profile(ctx, "personal-password-first-time", ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  @tag ownership_timeout: 60_000
  test "personal invite joins via google and status works", ctx do
    ctx =
      Factory.add_company_member(ctx, :invitee,
        name: "Google Invitee",
        email: "google-invitee@example.com",
        has_open_invitation: true
      )

    invitee_account = People.get_account!(ctx.invitee.account_id)
    invite_link = create_personal_invite_link!(ctx.company, ctx.creator, ctx.invitee)

    login_task =
      Task.async(fn ->
        run_cli(
          ctx,
          [
            "auth",
            "join",
            "--invite-token",
            invite_link.token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          "personal-google"
        ],
          script: [
            {"How would you like to sign in?", "2\n"}
          ]
        )
      end)

    session = wait_for_google_session!()
    complete_mock_google_join!(ctx, session, invite_link.token, account_id: invitee_account.id)

    result = Task.await(login_task, 25_000)

    assert result.exit_code == 0
    assert result.output =~ "Please sign in via Google:"

    assert Repo.reload!(invite_link).is_active == false

    invitee_account = Repo.reload!(invitee_account)
    assert invitee_account.first_login_at != nil

    assert_joined_profile(ctx, "personal-google", ctx.invitee.full_name, ctx.invitee.email, ctx.company.name)
  end

  test "company-wide invite joins via password, auto-selects the invited company, and status works", ctx do
    ctx = Factory.add_account(ctx, :inviter_account)
    ctx = Factory.add_company(ctx, :invited_company, ctx.inviter_account, name: "Invited Company")

    inviter = People.get_person!(ctx.inviter_account, ctx.invited_company)
    invite_link = create_company_wide_invite_link!(ctx.invited_company, inviter)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "join",
          "--invite-token",
          invite_link.token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          "company-password"
        ],
        script: [
          {"How would you like to sign in?", "1\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"Password:", "hello world!\n"},
          {"Select a company:", "2\n"}
        ]
      )

    assert result.exit_code == 0
    refute result.output =~ "Select a company:"

    assert Repo.reload!(invite_link).use_count == 1
    assert People.get_person!(ctx.account, ctx.invited_company)

    assert_joined_profile(ctx, "company-password", ctx.creator.full_name, ctx.creator.email, ctx.invited_company.name)
  end

  @tag ownership_timeout: 60_000
  test "company-wide invite joins a new google account and status works", ctx do
    ctx = Factory.add_account(ctx, :inviter_account)
    ctx = Factory.add_company(ctx, :invited_company, ctx.inviter_account, name: "Google Invited Company")

    inviter = People.get_person!(ctx.inviter_account, ctx.invited_company)
    invite_link = create_company_wide_invite_link!(ctx.invited_company, inviter)

    login_task =
      Task.async(fn ->
        run_cli(
          ctx,
          [
            "auth",
            "join",
            "--invite-token",
            invite_link.token,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          "company-google"
        ],
          script: [
            {"How would you like to sign in?", "2\n"}
          ]
        )
      end)

    session = wait_for_google_session!()

    complete_mock_google_join!(ctx, session, invite_link.token,
      email: "new-google-joiner@example.com",
      name: "New Google Joiner"
    )

    result = Task.await(login_task, 25_000)

    assert result.exit_code == 0
    assert result.output =~ "Please sign in via Google:"

    assert Repo.reload!(invite_link).use_count == 1

    account = People.get_account_by_email("new-google-joiner@example.com")
    assert account
    assert People.get_person!(account, ctx.invited_company)

    assert_joined_profile(ctx, "company-google", "New Google Joiner", "new-google-joiner@example.com", ctx.invited_company.name)
  end

  defp assert_joined_profile(ctx, profile, expected_name, expected_email, expected_company_name) do
    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", profile, "token"])

    assert config["activeProfile"] == profile
    assert is_binary(token)
    assert token != ""
    assert get_in(config, ["profiles", profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", profile, "name"]) == expected_name
    assert get_in(config, ["profiles", profile, "companyName"]) == expected_company_name

    status = run_cli(ctx, ["auth", "status", "--profile", profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{expected_name}"
    assert status.output =~ "Company: #{expected_company_name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"

    get_me = run_cli(ctx, ["people", "get_me", "--profile", profile])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "full_name"]) == expected_name
    assert get_in(payload, ["me", "email"]) == expected_email
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

  defp wait_for_google_session!(timeout_ms \\ 5_000) do
    deadline = System.monotonic_time(:millisecond) + timeout_ms
    do_wait_for_google_session(deadline)
  end

  defp do_wait_for_google_session(deadline) do
    session =
      from(s in CliAuthSession,
        where: s.auth_method == :google,
        order_by: [desc: s.inserted_at],
        limit: 1
      )
      |> Repo.one()

    cond do
      session && session.status == :pending ->
        session

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("Timed out waiting for the CLI to create a pending Google auth session")

      true ->
        Process.sleep(100)
        do_wait_for_google_session(deadline)
    end
  end

  defp complete_mock_google_join!(ctx, session, invite_token, identity) do
    # Keep the invite token on the mocked browser hop so the backend performs the real join.
    login_response = browser_get(ctx, "/cli-login/#{session.id}?#{google_join_query(invite_token, identity)}")

    assert login_response.status == 302
    assert login_response.headers["location"] =~ "/accounts/auth/test_google"

    auth_response = browser_get(ctx, login_response.headers["location"])

    assert auth_response.status == 302
    assert auth_response.headers["location"] == "/cli-login/#{session.id}/success"

    session = Repo.get!(CliAuthSession, session.id)
    assert session.status == :authenticated
  end

  defp google_join_query(invite_token, identity) do
    identity
    |> Keyword.put(:invite_token, invite_token)
    |> Enum.map(fn {key, value} -> {to_string(key), value} end)
    |> URI.encode_query()
  end
end
