defmodule OperatelyWeb.Api.Mutations.AddFirstCompanyTest do
  use OperatelyWeb.TurboCase

  @add_first_company_input %{
    company_name: "Acme Co.",
    full_name: "John Doe",
    email: "john@your-company.com",
    title: "CEO",
    password: "Aa12345#&!123",
    password_confirmation: "Aa12345#&!123"
  }

  describe "add_first_company functionality" do
    test "creates company and owner account", ctx do
      assert {200, res} = mutation(ctx.conn, :add_first_company, @add_first_company_input)
      assert res.company.id

      company = Operately.Companies.get_company_by_name("Acme Co.")
      account = Operately.People.get_account_by_email_and_password("john@your-company.com", "Aa12345#&!123")
      group = Operately.Groups.get_group(company.company_space_id)

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1
      assert account
      assert group

      person = Operately.Repo.preload(account, :people).people |> hd()
      owners = Operately.Companies.list_owners(company)

      assert Enum.any?(owners, fn o -> o.id == person.id end)
    end

    test "allows company and admin account creation only once", ctx do
      assert {200, _} = mutation(ctx.conn, :add_first_company, @add_first_company_input)
      assert {400, _res} = mutation(ctx.conn, :add_first_company, @add_first_company_input)

      assert Operately.Companies.count_companies() == 1
    end
  end
end 
