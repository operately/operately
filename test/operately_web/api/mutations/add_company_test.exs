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

      owners = Operately.Companies.list_account_owners(company)
      assert Enum.any?(owners, fn o -> o.id == person.id end)
    end
  end
end 
