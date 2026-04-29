defmodule OperatelyWeb.Api.CliAuthTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.CliAuthSession
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
      assert res.message =~ "not a member of any companies"
    end

    test "returns generic unauthorized for invalid credentials", ctx do
      assert {401, _res} =
               mutation(ctx.conn, [:cli_auth, :auth_password], %{
                 email: ctx.account.email,
                 password: "wrong password"
               })
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

    test "returns unauthorized when the bootstrap session is not authenticated", ctx do
      company_id = Paths.company_id(ctx.company)
      ctx = %{ctx | conn: ctx.conn} |> Map.take([:conn]) |> Factory.add_account(:lonely_account)
      {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
      assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.lonely_account)

      assert {401, _res} =
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
    test "creates account and returns no_companies on empty instance", ctx do
      assert Operately.Companies.count_companies() == 0
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser@test.com")

      inputs = %{
        email: "newuser@test.com",
        code: activation.code,
        full_name: "New User",
        password: "password1234"
      }

      assert {200, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)

      assert res.status == "no_companies"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.message =~ "not a member of any companies"
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

    test "creates account and joins company with valid invite token", ctx do
      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, activation} = Operately.People.EmailActivationCode.create("inviteduser@test.com")

      inputs = %{
        email: "inviteduser@test.com",
        code: activation.code,
        full_name: "Invited User",
        password: "password1234",
        invite_token: invite_link.token
      }

      assert {200, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)

      assert res.status == "authenticated"
      assert length(res.companies) == 1
      assert [company] = res.companies
      assert company.id == Paths.company_id(ctx.company)
      assert is_binary(res.bootstrap_token)
    end

    test "creates account but returns error with invalid invite token", ctx do
      {:ok, activation} = Operately.People.EmailActivationCode.create("badinvite@test.com")

      inputs = %{
        email: "badinvite@test.com",
        code: activation.code,
        full_name: "Bad Invite User",
        password: "password1234",
        invite_token: "invalid-token"
      }

      assert {200, res} = mutation(ctx.conn, [:cli_auth, :signup], inputs)

      assert res.status == "no_companies"
      assert res.companies == []
      assert is_binary(res.bootstrap_token)
      assert res.message =~ "Invalid invite link"
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

  describe "create_company" do
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
      assert signup_res.status == "no_companies"

      assert {200, res} =
               bootstrap_mutation(ctx.conn, signup_res.bootstrap_token, [:cli_auth, :create_company], %{
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
               bootstrap_mutation(ctx.conn, raw_token, [:cli_auth, :create_company], %{
                 company_name: "Another Company"
               })
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
  end

  describe "signup and create_company end-to-end" do
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

      assert signup_res.status == "no_companies"
      assert signup_res.companies == []
      assert is_binary(signup_res.bootstrap_token)

      # 4. Create company using bootstrap token
      assert {200, create_res} =
               bootstrap_mutation(ctx.conn, signup_res.bootstrap_token, [:cli_auth, :create_company], %{
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
end
