defmodule OperatelyWeb.AccountOauthControllerTest do
  use OperatelyWeb.ConnCase

  alias Operately.People
  alias OperatelyWeb.AccountAuth

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup do
    conn = build_conn()
    company = company_fixture(%{name: "Test Company"})

    {:ok, conn: conn, company: company}
  end

  describe "callback/2" do
    test "when a person with the given email exists in the company", ctx do
      assert Operately.People.list_people() == []

      person = person_fixture(%{company_id: ctx.company.id, email: "i.exist@text.com"})

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: person.email,
          image: "http://example.com/image.png",
          name: "Test User"
        }
      })

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})

      people = Operately.People.list_people()
      assert length(people) == 1

      saved_person = hd(people)
      assert saved_person.email == "i.exist@text.com"
      assert saved_person.id == person.id
      
      saved_account = Operately.Repo.preload(saved_person, :account).account
      assert saved_account.email == "i.exist@text.com"
    end

    test "when a person with the given doens't exists it creates a new person/account combo", ctx do
      assert Operately.People.list_people() == []

      conn = Plug.Conn.assign(ctx.conn, :ueberauth_auth, %{
        info: %{
          email: "new-email@text.com",
          image: "http://example.com/image.png",
          name: "Test User"
        }
      })

      conn = get(conn, ~p"/accounts/auth/google/callback", %{"provider" => "google"})

      people = Operately.People.list_people()
      assert length(people) == 1

      saved_person = hd(people)
      assert saved_person.email == "new-email@text.com"
      assert saved_person.account_id != nil
      assert saved_person.title == "Unknown Role"
      
      saved_account = Operately.Repo.preload(saved_person, :account).account
      assert saved_account.email == "new-email@text.com"
    end
  end
end
