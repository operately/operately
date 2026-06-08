defmodule OperatelyWeb.Api.CliAuthTest do
  use OperatelyWeb.TurboCase

  alias Operately.Activities.Activity
  alias Operately.Billing
  alias Operately.People.{CliAuthSession, EmailActivationCode}
  alias Operately.Support.Factory

  setup ctx do
    previous_allow_login_with_email = Application.get_env(:operately, :allow_login_with_email)
    previous_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)
    previous_allow_signup_with_email = Application.get_env(:operately, :allow_signup_with_email)

    Application.put_env(:operately, :allow_login_with_email, true)
    Application.put_env(:operately, :allow_login_with_google, true)
    Application.put_env(:operately, :allow_signup_with_email, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_login_with_email, previous_allow_login_with_email)
      Application.put_env(:operately, :allow_login_with_google, previous_allow_login_with_google)
      Application.put_env(:operately, :allow_signup_with_email, previous_allow_signup_with_email)
    end)

    if ctx[:empty_instance] do
      clear_instance_data()
      ctx
    else
      ctx |> Factory.setup()
    end
  end

  describe "auth_password" do
    test "returns bootstrap token and one company for a single-company account", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!"
               })

      assert res.status == "authenticated"
      assert is_binary(res.bootstrap_token)
      assert Enum.map(res.companies, & &1.id) == [Paths.company_id(ctx.company)]
    end

    test "returns all eligible companies for a multi-company account", ctx do
      ctx = Factory.add_company(ctx, :second_company, ctx.account, name: "Second Company")

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!"
               })

      ids = MapSet.new(Enum.map(res.companies, & &1.id))

      assert res.status == "authenticated"

      assert ids ==
               MapSet.new([
                 Paths.company_id(ctx.company),
                 Paths.company_id(ctx.second_company)
               ])
    end

    test "returns no_companies when the authenticated account has no eligible company", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.lonely_account.email,
                 password: "hello world!"
               })

      assert res.status == "no_companies"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.message =~ "not a member of any companies"

      assert {200, status_res} = bootstrap_query(ctx.conn, res.bootstrap_token, [:cli_auth, :status], %{})

      assert status_res.status == "no_companies"
      assert status_res.companies == []
    end

    test "returns generic unauthorized for invalid credentials", ctx do
      assert {401, _res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "wrong password"
               })
    end
  end

  describe "request_email_code" do
    test "creates an activation code for an existing account", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :request_email_code], %{
                 email: ctx.account.email
               })

      assert res == %{}

      code = Repo.get_by(EmailActivationCode, email: ctx.account.email)
      assert code != nil
      assert String.length(code.code) == 6
    end

    test "returns bad_request when no account exists for the email", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :request_email_code], %{
                 email: "missing@example.com"
               })

      assert res.message =~ "No account exists for this email"
    end

    test "returns forbidden when email login is disabled", ctx do
      Application.put_env(:operately, :allow_login_with_email, false)

      assert {403, _res} =
               mutation(ctx.conn, [:cli_auth, :request_email_code], %{
                 email: ctx.account.email
               })
    end

    test "returns bad_request when email delivery is not configured", ctx do
      original_app_env = Application.get_env(:operately, :app_env)
      original_sendgrid = System.get_env("SENDGRID_API_KEY")
      original_smtp = System.get_env("SMTP_SERVER")

      Application.put_env(:operately, :app_env, :prod)
      System.delete_env("SENDGRID_API_KEY")
      System.delete_env("SMTP_SERVER")

      on_exit(fn ->
        Application.put_env(:operately, :app_env, original_app_env)
        restore_env("SENDGRID_API_KEY", original_sendgrid)
        restore_env("SMTP_SERVER", original_smtp)
      end)

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :request_email_code], %{
                 email: ctx.account.email
               })

      assert res.message =~ "email delivery hasn't been configured"
    end

  end

  describe "auth_email_code" do
    test "returns bootstrap token and one company for a single-company account", ctx do
      {:ok, activation} = EmailActivationCode.create(ctx.account.email)

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: activation.code
               })

      assert res.status == "authenticated"
      assert is_binary(res.bootstrap_token)
      assert Enum.map(res.companies, & &1.id) == [Paths.company_id(ctx.company)]
      assert Repo.get(EmailActivationCode, activation.id) == nil

      assert {:ok, session} = CliAuthSession.authenticate(res.bootstrap_token)
      assert session.auth_method == :email_code
    end

    test "returns all eligible companies for a multi-company account", ctx do
      ctx = Factory.add_company(ctx, :second_company, ctx.account, name: "Second Company")
      {:ok, activation} = EmailActivationCode.create(ctx.account.email)

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: activation.code
               })

      ids = MapSet.new(Enum.map(res.companies, & &1.id))

      assert ids ==
               MapSet.new([
                 Paths.company_id(ctx.company),
                 Paths.company_id(ctx.second_company)
               ])
    end

    test "returns no_companies when the authenticated account has no eligible company", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)
      {:ok, activation} = EmailActivationCode.create(ctx.lonely_account.email)

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.lonely_account.email,
                 code: activation.code
               })

      assert res.status == "no_companies"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.message =~ "not a member of any companies"

      assert {200, status_res} = bootstrap_query(ctx.conn, res.bootstrap_token, [:cli_auth, :status], %{})
      assert status_res.status == "no_companies"
    end

    test "joins a company via company-wide invite token", ctx do
      ctx = Factory.add_account(ctx, :lonely_account)

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, activation} = EmailActivationCode.create(ctx.lonely_account.email)

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.lonely_account.email,
                 code: activation.code,
                 invite_token: invite_link.token
               })

      assert res.status == "authenticated"
      ids = Enum.map(res.companies, & &1.id)
      assert Paths.company_id(ctx.company) in ids
      assert Operately.People.get_person(ctx.lonely_account, ctx.company)
    end

    test "returns structured limit details when a company-wide invite join is blocked", ctx do
      ctx = Factory.add_account(ctx, :lonely_account)
      company = enable_billing(ctx.company)
      fill_company_to_member_limit(company)

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: company.id,
          author_id: ctx.creator.id
        })

      {:ok, activation} = EmailActivationCode.create(ctx.lonely_account.email)

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.lonely_account.email,
                 code: activation.code,
                 invite_token: invite_link.token
               })

      assert res.message ==
               "This company has reached its member limit: 20 of 20 active members. Adding or restoring people is blocked until this company is back within its plan limits."
      assert res.details.code == "member_count_limit_exceeded"
      assert res.details.limit_key == "member_count"
      assert res.details.plan_key == "free"
    end

    test "returns bad_request for an invalid code", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: "INVALID"
               })

      assert res.message == "Invalid activation code"
    end

    test "returns bad_request for an expired code", ctx do
      {:ok, activation} = EmailActivationCode.create(ctx.account.email)

      activation
      |> Ecto.Changeset.change(expires_at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(-1, :second))
      |> Repo.update!()

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: activation.code
               })

      assert res.message =~ "expired"
    end

    test "returns bad_request for an already-consumed code", ctx do
      {:ok, activation} = EmailActivationCode.create(ctx.account.email)

      assert {200, _res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: activation.code
               })

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: ctx.account.email,
                 code: activation.code
               })

      assert res.message == "Invalid activation code"
    end

    test "returns bad_request for first-time personal invites without consuming the code", ctx do
      {:ok, account} = Operately.People.Account.create("Invited Member", "blocked@example.com", :crypto.strong_rand_bytes(32) |> Base.encode64())

      {:ok, member} = Operately.People.create_person(%{
        full_name: "Invited Member",
        email: "blocked@example.com",
        company_id: ctx.company.id,
        account_id: account.id
      })

      {:ok, invite_link} =
        Operately.InviteLinks.create_personal_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      {:ok, activation} = EmailActivationCode.create(account.email)

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_email_code], %{
                 email: account.email,
                 code: activation.code,
                 invite_token: invite_link.token
               })

      assert res.message =~ "first-time invites"
      assert Repo.get(EmailActivationCode, activation.id) != nil
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    Billing.create_product(%{
      provider: "polar",
      plan_family: "team",
      billing_interval: "monthly",
      polar_product_id: "cli-auth-team-monthly-#{company.id}",
      active: true
    })

    company
  end

  defp fill_company_to_member_limit(company) do
    needed_people = max(20 - Billing.active_member_count(company), 0)

    if needed_people > 0 do
      Enum.each(1..needed_people, fn index ->
        Operately.PeopleFixtures.person_fixture_with_account(%{
          company_id: company.id,
          full_name: "Cli Auth Limit #{index}",
          email: "cli-auth-limit-#{index}@example.com"
        })
      end)
    end
  end
end

  describe "google bootstrap flow" do
    test "start_google creates a pending bootstrap session and status remains pending", ctx do
      assert {200, res} = mutation(ctx.conn, [:cli_auth, :start_google], %{})

      assert res.status == "pending"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.login_url =~ "/cli-login/"
      assert res.poll_interval_ms == CliAuthSession.poll_interval_ms()

      session = Repo.get!(CliAuthSession, extract_session_id(res.login_url))

      assert session.status == :pending
      assert session.account_id == nil

      assert {200, status_res} = bootstrap_query(ctx.conn, res.bootstrap_token, [:cli_auth, :status], %{})

      assert status_res.status == "pending"
      assert status_res.companies == []
    end

    test "start_google_signup creates a pending signup session and status remains pending", ctx do
      assert {200, res} = mutation(ctx.conn, [:cli_auth, :start_google_signup], %{})

      assert res.status == "pending"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.login_url =~ "/cli-login/"
      assert res.poll_interval_ms == CliAuthSession.poll_interval_ms()

      session = Repo.get!(CliAuthSession, extract_session_id(res.login_url))

      assert session.status == :pending
      assert session.intent == :signup
      assert session.account_id == nil

      assert {200, status_res} = bootstrap_query(ctx.conn, res.bootstrap_token, [:cli_auth, :status], %{})

      assert status_res.status == "pending"
      assert status_res.companies == []
    end

    test "status returns authenticated companies after google auth completes", ctx do
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.account)

      assert {200, res} = bootstrap_query(ctx.conn, raw_token, [:cli_auth, :status], %{})

      assert res.status == "authenticated"
      assert Enum.map(res.companies, & &1.id) == [Paths.company_id(ctx.company)]
    end

    test "status returns no_companies after google auth completes for an account without memberships", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.lonely_account)

      assert {200, res} = bootstrap_query(ctx.conn, raw_token, [:cli_auth, :status], %{})

      assert res.status == "no_companies"
      assert res.companies == []
      assert res.message =~ "not a member of any companies"
    end

    test "status returns authenticated with no companies after google signup completes for a new account", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session(:signup)
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.lonely_account, :created)

      assert {200, res} = bootstrap_query(ctx.conn, raw_token, [:cli_auth, :status], %{})

      assert res.status == "authenticated"
      assert res.companies == []
    end

    test "status returns failed when google signup resolves to an existing account", ctx do
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session(:signup)
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.account, :existing)

      assert {200, res} = bootstrap_query(ctx.conn, raw_token, [:cli_auth, :status], %{})

      assert res.status == "failed"
      assert res.companies == []
      assert res.message =~ "already exists for this Google account"
    end

    test "status returns unauthorized for a consumed bootstrap session", ctx do
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
      Repo.update!(CliAuthSession.changeset(session, %{status: :consumed}))

      assert {401, _res} = bootstrap_query(ctx.conn, raw_token, [:cli_auth, :status], %{})
    end
  end

  describe "create_token" do
    test "creates a token for the selected company and consumes the bootstrap session", ctx do
      assert {200, auth_res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!"
               })

      assert {200, create_res} =
               bootstrap_mutation(ctx.conn, auth_res.bootstrap_token, [:cli_auth, :create_token], %{
                 company_id: Paths.company_id(ctx.company),
                 read_only: false
               })

      assert create_res.company.id == Paths.company_id(ctx.company)
      assert create_res.api_token.read_only == false
      assert is_binary(create_res.token)

      assert {401, _res} =
               bootstrap_mutation(ctx.conn, auth_res.bootstrap_token, [:cli_auth, :create_token], %{
                 company_id: Paths.company_id(ctx.company),
                 read_only: true
               })
    end

    test "rejects company ids that do not belong to the bootstrap session", ctx do
      ctx
      |> Factory.add_account(:other_account)
      |> then(fn ctx -> Factory.add_company(ctx, :other_company, ctx.other_account, name: "Other Company") end)
      |> then(fn ctx ->
        assert {200, auth_res} =
                 mutation(ctx.conn, [:cli_auth, :auth_password], %{
                   email: ctx.account.email,
                   password: "hello world!"
                 })

        assert {404, _res} =
                 bootstrap_mutation(ctx.conn, auth_res.bootstrap_token, [:cli_auth, :create_token], %{
                   company_id: Paths.company_id(ctx.other_company),
                   read_only: true
                 })
      end)
    end

    test "returns not_found when an authenticated no-company bootstrap session selects an unrelated company", ctx do
      company_id = Paths.company_id(ctx.company)
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.lonely_account)

      assert {404, _res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :create_token], %{
                 company_id: company_id,
                 read_only: true
               })
    end
  end

  describe "check_account" do
    test "returns exists: true for an existing account", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :check_account], %{
                 email: ctx.account.email
               })

      assert res.exists == true
      assert res.has_password == true
    end

    test "returns exists: false for a non-existent account", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :check_account], %{
                 email: "nonexistent@test.com"
               })

      assert res.exists == false
      assert res.has_password == nil
    end

  end

  describe "signup" do
    @tag :empty_instance
    test "creates account and returns an authenticated bootstrap token on empty instance", ctx do
      assert Operately.Companies.count_companies() == 0
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser@test.com")

      inputs = %{
        email: "newuser@test.com",
        code: activation.code,
        full_name: "New User",
        password: "password1234"
      }

      assert {200, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)

      assert res.status == "authenticated"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)

      assert {200, status_res} = bootstrap_query(ctx.conn, res.bootstrap_token, [:cli_auth, :status], %{})
      assert status_res.status == "authenticated"
      assert status_res.companies == []
    end

    test "returns bad_request when email already exists", ctx do
      {:ok, activation} = Operately.People.EmailActivationCode.create(ctx.account.email)

      inputs = %{
        email: ctx.account.email,
        code: activation.code,
        full_name: "Duplicate User",
        password: "password1234"
      }

      assert {400, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)
      assert res.message =~ "already registered"
    end

    test "returns bad_request for invalid code", ctx do
      inputs = %{
        email: "newuser@test.com",
        code: "INVALID",
        full_name: "New User",
        password: "password1234"
      }

      assert {400, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)
      assert res.message =~ "Invalid activation code"
    end

    test "returns bad_request for expired code", ctx do
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser@test.com")

      activation
      |> Ecto.Changeset.change(expires_at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(-1, :second))
      |> Repo.update!()

      inputs = %{
        email: "newuser@test.com",
        code: activation.code,
        full_name: "New User",
        password: "password1234"
      }

      assert {400, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)
      assert res.message =~ "expired"
    end

    test "returns forbidden when signup is not allowed", ctx do
      Application.put_env(:operately, :allow_signup_with_email, false)

      inputs = %{
        email: "newuser@test.com",
        code: "ABCDEF",
        full_name: "New User",
        password: "password1234"
      }

      assert {403, _res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)
    end
  end

  describe "company_creation_status" do
    @tag :empty_instance
    test "returns configured false when there are no accounts and no companies", ctx do
      assert {200, res} = query(ctx.conn, [:cli_auth, :company_creation_status], %{})

      assert res.configured == false
    end

    test "returns configured true when there is at least one account", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)

      assert {200, res} = query(ctx.conn, [:cli_auth, :company_creation_status], %{})

      assert res.configured == true
    end
  end

  describe "setup_company" do
    @tag :empty_instance
    test "creates first company on empty instance after signup", ctx do
      assert Operately.Companies.count_companies() == 0

      {:ok, activation} = Operately.People.EmailActivationCode.create("founder@test.com")

      inputs = %{
        email: "founder@test.com",
        code: activation.code,
        full_name: "Founder",
        password: "password1234"
      }

      assert {200, signup_res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)
      assert signup_res.status == "authenticated"

      assert {200, res} =
               bootstrap_mutation(ctx.conn, signup_res.bootstrap_token, [:cli_auth, :setup_company], %{
                 company_name: "My New Company"
               })

      assert res.company.name == "My New Company"
      assert res.person.full_name == "Founder"

      account = Operately.People.get_account_by_email("founder@test.com")
      assert account.site_admin == true
    end

    test "returns forbidden when companies already exist", ctx do
      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account)

      assert {403, _res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :setup_company], %{
                 company_name: "Another Company"
               })
    end

    test "returns unauthorized with invalid bootstrap session", ctx do
      assert {401, _res} =
               bootstrap_mutation(ctx.conn, "invalid-token", [:cli_auth, :setup_company], %{
                 company_name: "My Company"
               })
    end

    test "returns unauthorized with expired bootstrap session", ctx do
      {:ok, session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account)

      session
      |> CliAuthSession.changeset(%{expires_at: DateTime.utc_now() |> DateTime.add(-1, :second)})
      |> Repo.update!()

      assert {401, _res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :setup_company], %{
                 company_name: "My Company"
               })
    end

    @tag :empty_instance
    test "creates the first company from a no-company password bootstrap session", ctx do
      ctx = Factory.add_account(ctx, :lonely_account)

      assert {200, auth_res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.lonely_account.email,
                 password: "hello world!"
               })

      assert auth_res.status == "no_companies"
      assert is_binary(auth_res.bootstrap_token)

      assert {200, res} =
               bootstrap_mutation(ctx.conn, auth_res.bootstrap_token, [:cli_auth, :setup_company], %{
                 company_name: "Bootstrap Company"
               })

      assert res.company.name == "Bootstrap Company"
      assert res.person.full_name == ctx.lonely_account.full_name
    end
  end

  describe "create_company" do
    test "creates company when companies already exist", ctx do
      assert Operately.Companies.count_companies() == 1

      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account)

      assert {200, res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :create_company], %{
                 company_name: "Second Company"
               })

      assert res.company.name == "Second Company"
      assert res.person.full_name == ctx.account.full_name
    end

    test "returns unauthorized with invalid bootstrap session", ctx do
      assert {401, _res} =
               bootstrap_mutation(ctx.conn, "invalid-token", [:cli_auth, :create_company], %{
                 company_name: "My Company"
               })
    end

    test "returns unauthorized with expired bootstrap session", ctx do
      {:ok, session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account)

      session
      |> CliAuthSession.changeset(%{expires_at: DateTime.utc_now() |> DateTime.add(-1, :second)})
      |> Repo.update!()

      assert {401, _res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :create_company], %{
                 company_name: "My Company"
               })
    end

    test "creates a company from a no-company password bootstrap session on a non-empty instance", ctx do
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)

      assert {200, auth_res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.lonely_account.email,
                 password: "hello world!"
               })

      assert auth_res.status == "no_companies"
      assert is_binary(auth_res.bootstrap_token)

      assert {200, res} =
               bootstrap_mutation(ctx.conn, auth_res.bootstrap_token, [:cli_auth, :create_company], %{
                 company_name: "Later Company"
               })

      assert res.company.name == "Later Company"
      assert res.person.full_name == ctx.lonely_account.full_name
    end
  end

  describe "signup and setup_company end-to-end" do
    @tag :empty_instance
    test "new user signs up and creates the first company on an empty instance", ctx do
      assert Operately.Companies.count_companies() == 0

      # 1. Check account does not exist
      assert {200, check_res} =
               mutation(ctx.conn, [:cli_auth, :check_account], %{email: "founder@example.com"})

      assert check_res.exists == false

      # 2. Create email activation code
      {:ok, activation} = Operately.People.EmailActivationCode.create("founder@example.com")

      # 3. Sign up
      assert {200, signup_res} =
               mutation(ctx.conn, [:cli_auth, :signup], %{
                 email: "founder@example.com",
                 code: activation.code,
                 full_name: "Jane Founder",
                 password: "password1234"
               })

      assert signup_res.status == "authenticated"
      assert signup_res.companies == []
      assert is_binary(signup_res.bootstrap_token)

      # 4. Create company using bootstrap token
      assert {200, create_res} =
               bootstrap_mutation(ctx.conn, signup_res.bootstrap_token, [:cli_auth, :setup_company], %{
                 company_name: "Jane's Company"
               })

      assert create_res.company.name == "Jane's Company"
      assert create_res.person.full_name == "Jane Founder"

      # 5. Query status to verify session is now authenticated with the company
      assert {200, status_res} =
               bootstrap_query(ctx.conn, signup_res.bootstrap_token, [:cli_auth, :status], %{})

      assert status_res.status == "authenticated"
      assert length(status_res.companies) == 1
      assert hd(status_res.companies).id == create_res.company.id
    end
  end

  describe "join_with_invite" do
    test "joins a company-wide invite using an authenticated bootstrap session", ctx do
      ctx = Factory.add_account(ctx, :lonely_account)

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(ctx.lonely_account, :password, :signup)

      assert {200, res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :join_with_invite], %{
                 token: invite_link.token
               })

      assert res.company.id == Paths.company_id(ctx.company)
      assert Operately.People.get_person(ctx.lonely_account, ctx.company)
    end

    test "joins a personal invite using an authenticated bootstrap session for the invited account", ctx do
      {:ok, account} = Operately.People.Account.create("Invited Member", "invited@example.com", :crypto.strong_rand_bytes(32) |> Base.encode64())

      {:ok, member} = Operately.People.create_person(%{
        full_name: "Invited Member",
        email: "invited@example.com",
        company_id: ctx.company.id,
        account_id: account.id
      })

      {:ok, invite_link} =
        Operately.InviteLinks.create_personal_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(account, :password, :signup)

      assert {200, res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :join_with_invite], %{
                 token: invite_link.token
               })

      assert res.company.id == Paths.company_id(ctx.company)
      assert Repo.reload!(invite_link).is_active == false

      activity = Repo.get_by(Activity, action: "company_member_joined", author_id: member.id)

      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["person_id"] == member.id
    end

    test "returns bad_request for invalid invite token", ctx do
      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account, :password, :signup)

      assert {400, res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :join_with_invite], %{
                 token: "invalid-token"
               })

      assert res.message == "Invalid invite link"
    end

    test "returns bad_request for inactive invite token", ctx do
      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      Operately.InviteLinks.revoke_invite_link(invite_link)
      {:ok, _session, raw_token} = CliAuthSession.create_authenticated_session(ctx.account, :password, :signup)

      assert {400, res} =
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :join_with_invite], %{
                 token: invite_link.token
               })

      assert res.message == "This invite link is no longer valid"
    end
  end

  describe "auth_password with invite_token" do
    test "joins company via invite link for existing account and returns the company", ctx do
      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!",
                 invite_token: invite_link.token
               })

      assert res.status == "authenticated"
      ids = Enum.map(res.companies, & &1.id)
      assert Paths.company_id(ctx.company) in ids
      assert is_binary(res.bootstrap_token)
    end

    test "returns bad_request for invalid invite token", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!",
                 invite_token: "invalid-token"
               })

      assert res.message == "Invalid invite link"
    end

    test "returns bad_request for inactive invite token", ctx do
      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      Operately.InviteLinks.revoke_invite_link(invite_link)

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "hello world!",
                 invite_token: invite_link.token
               })

      assert res.message == "This invite link is no longer valid"
    end
  end

  describe "start_google with invite_token" do
    test "login_url includes the invite_token as a query parameter", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :start_google], %{
                 invite_token: "my-invite-token"
               })

      assert res.status == "pending"
      assert res.login_url =~ "/cli-login/"
      assert res.login_url =~ "invite_token=my-invite-token"
    end

    test "login_url omits invite_token when not provided", ctx do
      assert {200, res} = mutation(ctx.conn, [:cli_auth, :start_google], %{})

      assert res.status == "pending"
      assert res.login_url =~ "/cli-login/"
      refute res.login_url =~ "invite_token"
    end
  end

  describe "join_company" do
    test "sets password and joins company for a personal invite link", ctx do
      {:ok, account} = Operately.People.Account.create("Invited Member", "invited@example.com", :crypto.strong_rand_bytes(32) |> Base.encode64())

      {:ok, member} = Operately.People.create_person(%{
        full_name: "Invited Member",
        email: "invited@example.com",
        company_id: ctx.company.id,
        account_id: account.id
      })

      {:ok, invite_link} =
        Operately.InviteLinks.create_personal_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      assert {200, res} =
               mutation(ctx.conn, [:cli_auth, :join_company], %{
                 token: invite_link.token,
                 password: "newPassword123",
                 password_confirmation: "newPassword123"
               })

      assert res.status == "authenticated"
      assert length(res.companies) == 1
      assert hd(res.companies).id == Paths.company_id(ctx.company)
      assert is_binary(res.bootstrap_token)

      assert Operately.People.get_account_by_email_and_password("invited@example.com", "newPassword123") != nil
    end

    test "returns bad_request when the password update fails", ctx do
      {:ok, account} = Operately.People.Account.create("Invited Member", "invited@example.com", :crypto.strong_rand_bytes(32) |> Base.encode64())

      {:ok, member} = Operately.People.create_person(%{
        full_name: "Invited Member",
        email: "invited@example.com",
        company_id: ctx.company.id,
        account_id: account.id
      })

      {:ok, invite_link} =
        Operately.InviteLinks.create_personal_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      session_count = Repo.aggregate(CliAuthSession, :count)

      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :join_company], %{
                 token: invite_link.token,
                 password: "shortpass1",
                 password_confirmation: "shortpass1"
               })

      assert res.message =~ "should be at least 12 character"
      assert Operately.People.get_account_by_email_and_password("invited@example.com", "shortpass1") == nil
      assert Repo.reload!(invite_link).is_active
      assert Repo.aggregate(CliAuthSession, :count) == session_count
    end

    test "returns bad_request when passwords don't match", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :join_company], %{
                 token: "any-token",
                 password: "password1",
                 password_confirmation: "password2"
               })

      assert res.message == "Passwords don't match"
    end

    test "returns bad_request for invalid personal invite token", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:cli_auth, :join_company], %{
                 token: "invalid-token",
                 password: "password123",
                 password_confirmation: "password123"
               })

      assert res.message == "Invalid token"
    end
  end

  defp bootstrap_query(conn, token, query_name, inputs) do
    conn
    |> Plug.Conn.put_req_header("authorization", "Bearer #{token}")
    |> query(query_name, inputs)
  end

  defp bootstrap_mutation(conn, token, mutation_name, inputs) do
    conn
    |> Plug.Conn.put_req_header("authorization", "Bearer #{token}")
    |> mutation(mutation_name, inputs)
  end

  defp extract_session_id(login_url) do
    login_url
    |> URI.parse()
    |> Map.fetch!(:path)
    |> String.split("/")
    |> List.last()
  end

  defp restore_env(key, nil), do: System.delete_env(key)
  defp restore_env(key, value), do: System.put_env(key, value)

  defp clear_instance_data do
    Repo.query!("TRUNCATE TABLE companies, accounts RESTART IDENTITY CASCADE")
  end
end
