defmodule Operately.Operations.CompanyAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.Person

  def run(attrs) do
    Multi.new()
    |> Multi.insert(:company, Company.changeset(%{name: attrs.company_name}))
    |> Multi.insert(:account, Account.registration_changeset(%{email: attrs.email, password: attrs.password}))
    |> insert_person(attrs.full_name, attrs.role)
    |> Repo.transaction()
    |> Repo.extract_result(:company)
  end

  def insert_person(multi, full_name, role) do
    Multi.run(multi, :person, fn _repo, %{company: company, account: account} ->
      Person.changeset(%{
        company_id: company.id,
        account_id: account.id,
        full_name: full_name,
        email: account.email,
        avatar_url: "",
        title: role
      })
      |> Repo.insert()

      {:ok, nil}
    end)
  end
end
