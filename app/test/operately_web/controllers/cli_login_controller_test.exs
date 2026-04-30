defmodule OperatelyWeb.CliLoginControllerTest do
  use OperatelyWeb.ConnCase

  alias Operately.People.CliAuthSession
  alias Operately.Repo

  import Operately.CompaniesFixtures

  setup %{conn: conn} do
    previous_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)
    Application.put_env(:operately, :allow_login_with_google, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_login_with_google, previous_allow_login_with_google)
    end)

    conn =
      conn
      |> Map.replace!(:secret_key_base, OperatelyWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})

    company = company_fixture(%{company_name: "CLI Company"})
    creator = company |> Ecto.assoc(:people) |> Operately.Repo.one() |> Operately.Repo.preload(:account)

    %{conn: conn, company: company, creator: creator}
  end

  test "show stores the cli auth session id and redirects into google auth", ctx do
    {:ok, session, _raw_token} = CliAuthSession.create_pending_google_session()

    conn = get(ctx.conn, "/cli-login/#{session.id}")

    assert redirected_to(conn) == "/accounts/auth/google?redirect_to=%2Fcli-login%2F#{session.id}%2Fsuccess"
    assert get_session(conn, :oauth_cli_auth_session_id) == session.id
  end

  test "success page does not leak the bootstrap token", ctx do
    {:ok, session, raw_token} = CliAuthSession.create_pending_google_session()
    assert {:ok, _session} = CliAuthSession.complete_google_auth(session, ctx.creator.account)

    conn = get(ctx.conn, "/cli-login/#{session.id}/success")

    assert html_response(conn, 200) =~ "Authentication Complete"
    refute conn.resp_body =~ raw_token
  end

  test "google callback completes the cli auth session and redirects to the success page", ctx do
    {:ok, session, _raw_token} = CliAuthSession.create_pending_google_session()

    conn =
      ctx.conn
      |> init_test_session(%{
        oauth_cli_auth_session_id: session.id,
        oauth_redirect_to: "/cli-login/#{session.id}/success"
      })
      |> fetch_flash()
      |> Plug.Conn.assign(:ueberauth_auth, %{
        info: %{
          email: ctx.creator.account.email,
          image: "http://example.com/avatar.png",
          name: ctx.creator.full_name
        }
      })
      |> get("/accounts/auth/google/callback", %{"provider" => "google"})

    updated_session = Repo.get!(CliAuthSession, session.id)

    assert redirected_to(conn) == "/cli-login/#{session.id}/success"
    assert updated_session.status == :authenticated
    assert updated_session.account_id == ctx.creator.account_id
  end

  test "google callback marks no_companies when the authenticated account has no memberships", ctx do
    lonely_account = Operately.PeopleFixtures.account_fixture()
    {:ok, session, _raw_token} = CliAuthSession.create_pending_google_session()

    conn =
      ctx.conn
      |> init_test_session(%{
        oauth_cli_auth_session_id: session.id,
        oauth_redirect_to: "/cli-login/#{session.id}/success"
      })
      |> fetch_flash()
      |> Plug.Conn.assign(:ueberauth_auth, %{
        info: %{
          email: lonely_account.email,
          image: "http://example.com/avatar.png",
          name: lonely_account.full_name
        }
      })
      |> get("/accounts/auth/google/callback", %{"provider" => "google"})

    updated_session = Repo.get!(CliAuthSession, session.id)

    assert redirected_to(conn) == "/cli-login/#{session.id}/success"
    assert updated_session.status == :failed
    assert updated_session.failure_reason == CliAuthSession.no_companies_reason()
  end

  test "show forwards invite_token to the google auth redirect url", ctx do
    {:ok, session, _raw_token} = CliAuthSession.create_pending_google_session()

    conn = get(ctx.conn, "/cli-login/#{session.id}?invite_token=my-invite-token")

    assert redirected_to(conn) == "/accounts/auth/google?redirect_to=%2Fcli-login%2F#{session.id}%2Fsuccess&invite_token=my-invite-token"
    assert get_session(conn, :oauth_cli_auth_session_id) == session.id
  end

  test "google callback handles invite before completing cli auth session", ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    lonely_account = Operately.PeopleFixtures.account_fixture()
    {:ok, session, _raw_token} = CliAuthSession.create_pending_google_session()

    conn =
      ctx.conn
      |> init_test_session(%{
        oauth_cli_auth_session_id: session.id,
        oauth_redirect_to: "/cli-login/#{session.id}/success"
      })
      |> fetch_flash()
      |> Plug.Conn.assign(:ueberauth_auth, %{
        info: %{
          email: lonely_account.email,
          image: "http://example.com/avatar.png",
          name: lonely_account.full_name
        }
      })
      |> get("/accounts/auth/google/callback", %{
        "provider" => "google",
        "invite_token" => invite_link.token
      })

    updated_session = Repo.get!(CliAuthSession, session.id)

    assert redirected_to(conn) == OperatelyWeb.Paths.home_path(ctx.company)
    assert updated_session.status == :authenticated
    assert updated_session.account_id == lonely_account.id

    person = Operately.People.get_person(lonely_account, ctx.company)
    assert person != nil
  end
end
