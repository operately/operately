defmodule Operately.Mix.Tasks.Add.Account.To.CompanyTest do
  use Operately.DataCase

  test "run/1 adds an account to a company" do
    Mix.Tasks.Operately.Create.Account.run(["john@localhost.dev", "password123456"])
    Mix.Tasks.Operately.Create.Company.run(["Acme Inc."])
    Mix.Tasks.Operately.Add.Account.To.Company.run(["john@localhost.dev", "Acme Inc.", "John Doe", "Software Engineer"])

    company = Operately.Companies.get_company_by_name("Acme Inc.")
    account = Operately.People.get_account_by_email("john@localhost.dev")

    assert person = Operately.People.get_person_by_email(company, "john@localhost.dev")
    assert person.full_name == "John Doe"
    assert person.title == "Software Engineer"
    assert person.company_id == company.id
    assert person.account_id == account.id
  end
end
