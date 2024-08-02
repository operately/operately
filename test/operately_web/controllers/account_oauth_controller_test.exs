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

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})
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

    test "when a person with the given email doesn't exists and the email is allowed => it creates a new person/account combo", ctx do
      {:ok, _} = Operately.Companies.update_company(ctx.company, %{trusted_email_domains: ["@text.com"]})

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1 # company creator

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: "new-email@text.com",
          image: "http://example.com/image.png",
          name: "Michael Bolton"
        }
      })

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      people = Operately.People.list_people(ctx.company.id)
      assert length(people) == 2 # company creator + new person

      saved_person = Operately.People.get_person_by_email(ctx.company, "new-email@text.com")
      assert saved_person.email == "new-email@text.com"
      assert saved_person.account_id != nil
      assert saved_person.title == "Unknown Role"
      
      saved_account = Operately.Repo.preload(saved_person, :account).account
      assert saved_account.email == "new-email@text.com"
    end

    test "when a person with the given doesn't exists, but the email is not allowed => it rejects the request", ctx do
      {:ok, _} = Operately.Companies.update_company(ctx.company, %{trusted_email_domains: ["@text.com"]})

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1 # company creator

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: "new-email@dmif.com",
          image: "http://example.com/image.png",
          name: "Michael Bolton"
        }
      })

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302
      assert conn.assigns.flash == %{"error" => "Authentication failed"}

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1 # company creator
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

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})
      assert conn.status == 302

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 2 # company creator + person

      saved_person = Operately.People.get_person_by_email(ctx.company, person.email)
      assert saved_person.avatar_url == "http://example.com/new-image.png"
    end
  end
end
