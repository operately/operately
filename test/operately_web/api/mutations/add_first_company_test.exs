defmodule OperatelyWeb.Api.Mutations.AddFirstCompanyTest do
  use OperatelyWeb.TurboCase

  @add_first_company_input %{
    company_name: "Acme Co.",
    full_name: "John Doe",
    email: "john@your-company.com",
    role: "CEO",
    password: "Aa12345#&!123",
    password_confirmation: "Aa12345#&!123"
  }

  describe "add_first_company functionality" do
    test "creates company and admin account", ctx do
      assert {200, res} = mutation(ctx.conn, :add_first_company, @add_first_company_input)
      assert res.company.id

      company = Operately.Companies.get_company_by_name("Acme Co.")
      account = Operately.People.get_account_by_email_and_password("john@your-company.com", "Aa12345#&!123")
      group = Operately.Groups.get_group(company.company_space_id)

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1
      assert account
      assert group

      account = Operately.Repo.preload(account, :person)
      assert account.person.company_role == :admin
    end

    test "allows company and admin account creation only once", ctx do
      assert {200, _} = mutation(ctx.conn, :add_first_company, @add_first_company_input)
      assert {400, _res} = mutation(ctx.conn, :add_first_company, @add_first_company_input)

      assert Operately.Companies.count_companies() == 1
    end
  end
end 
