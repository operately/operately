defmodule OperatelyWeb.AccountOauthControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InviteLinksFixtures

  alias OperatelyWeb.Paths

  setup do
    conn = build_conn()
    company = company_fixture(%{name: "Test Company"})

    {:ok, conn: conn, company: company}
  end

  describe "callback/2" do
    test "creating a new account while attempting log in", ctx do
      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: "john@example.localhost",
          image: "http://example.com/image.png",
          name: "John Doe"
        }
      })

      conn = get(conn, "/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      assert Operately.People.get_account_by_email("john@example.localhost")
    end

    test "when a person with the given email exists in the company", ctx do
      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1 # company creator

      person = person_fixture_with_account(%{company_id: ctx.company.id, email: "i.exist@text.com"})

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: person.email,
          image: "http://example.com/image.png",
          name: "Michael Bolton"
        }
      })

      conn = get(conn, "/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      people = Operately.People.list_people(ctx.company.id)
      assert length(people) == 2 # company creator + person

      saved_person = Operately.People.get_person_by_email(ctx.company, person.email)
      assert saved_person.email == "i.exist@text.com"
      assert saved_person.id == person.id
      assert saved_person.avatar_url == "http://example.com/image.png"
      
      saved_account = Operately.Repo.preload(saved_person, :account).account
      assert saved_account.email == "i.exist@text.com"
    end

    test "when the account exists, but the avatar_url is different, it updates the avatar_url", ctx do
      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1 # company creator

      person = person_fixture_with_account(%{
        company_id: ctx.company.id, 
        email: "exist@text.com",
        avatar_url: "http://example.com/old-image.png"
      })

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: person.email,
          image: "http://example.com/new-image.png",
          name: "Test User"
        }
      })

      conn = get(conn, "/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 2 # company creator + person

      saved_person = Operately.People.get_person_by_email(ctx.company, person.email)
      assert saved_person.avatar_url == "http://example.com/new-image.png"
    end

    test "when invite_token is provided, joins company and redirects to home", ctx do
      author = person_fixture_with_account(%{company_id: ctx.company.id})

      person =
        person_fixture_with_account(%{
          company_id: ctx.company.id,
          email: "invited@example.com",
          has_open_invitation: true
        })

      invite_link =
        personal_invite_link_fixture(%{
          company_id: ctx.company.id,
          author_id: author.id,
          person_id: person.id
        })

      conn =
        Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
          info: %{
            email: person.email,
            image: "http://example.com/image.png",
            name: person.full_name
          }
        })

      conn =
        get(conn, "/accounts/auth/google/callback", %{
          "provider" => "google",
          "invite_token" => invite_link.token
        })

      assert conn.status == 302
      assert redirected_to(conn) == Paths.home_path(ctx.company)
    end
  end

  describe "OAuth redirect" do
    setup ctx do
      conn =
        ctx.conn
        |> Map.replace!(:secret_key_base, OperatelyWeb.Endpoint.config(:secret_key_base))
        |> init_test_session(%{})

      %{ctx | conn: conn}
    end

    test "stores redirect_to parameter during request phase", %{conn: conn} do
      conn = get(conn, "/accounts/auth/google?redirect_to=/company/goals")

      assert get_session(conn, :oauth_redirect_to) == "/company/goals"
    end

    test "uses redirect_to parameter from session during callback phase", %{conn: conn} do
      first_conn = get(conn, "/accounts/auth/google?redirect_to=/company/goals")

      conn =
        conn
        |> init_test_session(get_session(first_conn))
        |> fetch_flash()
        |> Plug.Conn.assign(:ueberauth_auth, %{
          info: %{
            email: "john@example.localhost",
            image: "http://example.com/image.png",
            name: "John Doe"
          }
        })
        |> get("/accounts/auth/google/callback", %{"provider" => "google"})

      # Verify that the redirect happened to the correct location
      assert redirected_to(conn) == "/company/goals"

      # Verify that the session variable was cleared
      assert get_session(conn, :oauth_redirect_to) == nil
    end

    test "handles empty redirect_to parameter", %{conn: conn} do
      first_conn = get(conn, "/accounts/auth/google?redirect_to=")

      assert get_session(first_conn, :oauth_redirect_to) == nil

      conn =
        conn
        |> init_test_session(get_session(first_conn))
        |> fetch_flash()
        |> Plug.Conn.assign(:ueberauth_auth, %{
          info: %{
            email: "john@example.localhost",
            image: "http://example.com/image.png",
            name: "John Doe"
          }
        })
        |> get("/accounts/auth/google/callback", %{"provider" => "google"})

      assert redirected_to(conn) == "/"
    end
  end
end
