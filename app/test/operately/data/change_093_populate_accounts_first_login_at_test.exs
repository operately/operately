defmodule Operately.Data.Change093PopulateAccountsFirstLoginAtTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures

  alias Operately.People.{Account, Person}
  alias Operately.Repo

  test "populates first_login_at for accounts with closed invitations only" do
    company = company_fixture()

    existing_time = DateTime.utc_now() |> DateTime.add(-3600, :second) |> DateTime.truncate(:second)

    account_closed = Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "closed@localhost", hashed_password: "123"}))
    account_open = Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "open@localhost", hashed_password: "123"}))
    account_existing = Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "existing@localhost", hashed_password: "123", first_login_at: existing_time}))
    account_no_person = Repo.insert!(Ecto.Changeset.change(%Account{}, %{email: "noperson@localhost", hashed_password: "123"}))

    person_closed = insert_person(company, account_closed, "Closed Person", "closed@localhost")
    person_open = insert_person(company, account_open, "Open Person", "open@localhost")
    person_existing = insert_person(company, account_existing, "Existing Person", "existing@localhost")

    set_has_open_invitation(person_closed.id, false)
    set_has_open_invitation(person_open.id, true)
    set_has_open_invitation(person_existing.id, false)

    assert is_nil(Repo.get!(Account, account_closed.id).first_login_at)
    assert is_nil(Repo.get!(Account, account_open.id).first_login_at)
    assert Repo.get!(Account, account_existing.id).first_login_at == existing_time
    assert is_nil(Repo.get!(Account, account_no_person.id).first_login_at)

    Operately.Data.Change093PopulateAccountsFirstLoginAt.run()

    assert Repo.get!(Account, account_closed.id).first_login_at
    assert is_nil(Repo.get!(Account, account_open.id).first_login_at)
    assert Repo.get!(Account, account_existing.id).first_login_at == existing_time
    assert is_nil(Repo.get!(Account, account_no_person.id).first_login_at)
  end

  defp insert_person(company, account, name, email) do
    {:ok, person} =
      Person.changeset(%Person{}, %{
        company_id: company.id,
        account_id: account.id,
        full_name: name,
        email: email
      })
      |> Repo.insert()

    person
  end

  defp set_has_open_invitation(person_id, value) do
    person_id = Ecto.UUID.dump!(person_id)

    from(p in "people", where: p.id == ^person_id)
    |> Repo.update_all(set: [has_open_invitation: value])
  end
end
