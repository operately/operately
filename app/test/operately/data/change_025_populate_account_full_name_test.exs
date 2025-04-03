defmodule Operately.Data.Change025PopulateAccountFullNameTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People.Account

  test "it populates account full name based on person records" do
    company = company_fixture()

    account1 = Operately.Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "a1@localhost", hashed_password: "123"}))
    account2 = Operately.Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "a2@localhost", hashed_password: "123"}))

    person1 = person_fixture(%{account_id: account1.id, full_name: "John Doe", company_id: company.id})
    person2 = person_fixture(%{account_id: account2.id, full_name: "Hannah Poppins", company_id: company.id})

    assert account1.full_name == nil
    assert account2.full_name == nil

    Operately.Data.Change025PopulateAccountFullName.run()

    account1 = Operately.Repo.get!(Operately.People.Account, person1.account_id)
    account2 = Operately.Repo.get!(Operately.People.Account, person2.account_id)

    assert account1.full_name == "John Doe"
    assert account2.full_name == "Hannah Poppins"
  end

end
