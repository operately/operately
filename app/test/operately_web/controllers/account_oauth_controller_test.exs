defmodule OperatelyWeb.AccountOauthControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  alias OperatelyWeb.AccountAuth

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
  end

  describe "OAuth redirect" do
    setup ctx do
      conn =
        ctx.conn
        |> Map.replace!(:secret_key_base, OperatelyWeb.Endpoint.config(:secret_key_base))
        |> init_test_session(%{})

      %{ctx | conn: conn}
    end

    test "redirects to stored return path after successful authentication", %{conn: conn} do
      halted_conn =
        %{conn | path_info: ["company", "goals"], query_string: ""}
        |> fetch_flash()
        |> AccountAuth.require_authenticated_account([])

      assert halted_conn.halted
      assert get_session(halted_conn, :account_return_to) == "/company/goals"

      conn =
        halted_conn
        |> Plug.Conn.assign(:ueberauth_auth, %{
          info: %{
            email: "john@example.localhost",
            image: "http://example.com/image.png",
            name: "John Doe"
          }
        })
        |> get("/accounts/auth/google/callback", %{"provider" => "google"})

      assert get_session(conn, :account_return_to) == "/company/goals"
    end
  end
end
