defmodule OperatelyWeb.Api.CliAuthTest do
  use OperatelyWeb.TurboCase

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

    ctx
    |> Factory.setup()
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
