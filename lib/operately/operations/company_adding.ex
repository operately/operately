defmodule Operately.Operations.CompanyAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Groups

  def run(attrs) do
    Multi.new()
    |> Multi.insert(:company, Company.changeset(%{name: attrs.company_name}))
    |> insert_group()
    |> Multi.insert(:account, Account.registration_changeset(%{email: attrs.email, password: attrs.password}))
    |> insert_person(attrs.full_name, attrs.role)
    |> Repo.transaction()
    |> Repo.extract_result(:company)
  end

  def insert_group(multi) do
    attrs = %{
      name: "Company",
      mission: "Everyone in the company",
      icon: "IconBuildingEstate",
      color: "text-cyan-500"
    }

    multi
    |> Groups.insert_group(attrs)
    |> Multi.update(:updated_company, fn %{company: company, group: group} ->
      Company.changeset(company, %{company_space_id: group.id})
    end)
  end

  def insert_person(multi, full_name, role) do
    Multi.insert(multi, :person, fn changes ->
      Person.changeset(%{
        company_id: changes[:company].id,
        account_id: changes[:account].id,
        full_name: full_name,
        email: changes[:account].email,
        avatar_url: "",
        title: role,
        company_role: :admin,
      })
    end)
  end
end
