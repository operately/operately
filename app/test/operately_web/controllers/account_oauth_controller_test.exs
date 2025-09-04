defmodule OperatelyWeb.AccountOauthControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

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

    test "creating a new account with Google OAuth preserves avatar image", ctx do
      # This test simulates the full flow: OAuth login -> company creation
      # to ensure that the avatar from Google is preserved throughout
      
      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: "jane@example.localhost",
          image: "http://example.com/google-avatar.png",
          name: "Jane Smith"
        }
      })

      # First, authenticate with Google OAuth
      conn = get(conn, "/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      # Verify account was created with avatar URL
      account = Operately.People.get_account_by_email("jane@example.localhost")
      assert account
      assert account.full_name == "Jane Smith"
      assert account.avatar_url == "http://example.com/google-avatar.png"

      # Now create a company (this is when person record gets created)
      {:ok, company} = Operately.Operations.CompanyAdding.run(%{
        company_name: "Jane's Company", 
        title: "CEO"
      }, account)

      # Get the person that was created
      person = Operately.People.get_person!(account, company)
      
      # Verify the avatar was carried over to the person record
      assert person.avatar_url == "http://example.com/google-avatar.png"
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
