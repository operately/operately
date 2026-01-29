defmodule OperatelyWeb.Api.Mutations.AddCompanyTest do
  use OperatelyWeb.TurboCase
  alias Operately.Repo

  @input %{
    company_name: "Acme Co.",
    title: "Founder"
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_company_member, %{})
    end
  end

  describe "add_company functionality" do
    test "creates company and an associated person record", ctx do
      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = mutation(conn, :add_company, @input)
      assert res.company.name == "Acme Co."

      company = Operately.Companies.get_company_by_name("Acme Co.")
      people = Ecto.assoc(company, :people) |> Repo.all()

      assert length(people) == 1

      person = hd(people)
      assert person.full_name == account.full_name
      assert person.title == "Founder"
      assert person.account_id == account.id
      assert person.company_id == company.id

      reloaded_account = Operately.People.get_account_by_email(account.email)
      refute reloaded_account.site_admin

      owners = Operately.Companies.list_owners(company)
      assert Enum.any?(owners, fn o -> o.id == person.id end)
    end

    test "uses avatar from existing person when creating a new company", ctx do
      account = Operately.PeopleFixtures.account_fixture()

      # Create an existing company with a person that has an avatar
      existing_company = Operately.CompaniesFixtures.company_fixture()
      Operately.PeopleFixtures.person_fixture(%{
        account_id: account.id,
        company_id: existing_company.id,
        avatar_url: "https://example.com/avatar.jpg"
      })

      conn = log_in_account(ctx.conn, account)

      # Create a new company with the same account
      assert {200, res} = mutation(conn, :add_company, @input)
      assert res.company.name == "Acme Co."

      company = Operately.Companies.get_company_by_name("Acme Co.")
      people = Ecto.assoc(company, :people) |> Repo.all()

      assert length(people) == 1

      person = hd(people)
      assert person.avatar_url == "https://example.com/avatar.jpg"
    end
  end
end
