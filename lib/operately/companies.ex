defmodule Operately.Companies do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Companies.Company
  alias Operately.Tenets.Tenet
  alias Operately.People.Person

  def get_company_id() do
    Repo.one(from c in Company, select: c.id)
  end

  def list_companies do
    Repo.all(Company)
  end

  def list_tenets(id) do
    Repo.all(from t in Tenet, where: t.company_id == ^id)
  end

  def get_company!(id), do: Repo.get!(Company, id)

  def create_company(attrs \\ %{}) do
    %Company{}
    |> Company.changeset(attrs)
    |> Repo.insert()
  end

  def update_company(%Company{} = company, attrs) do
    company
    |> Company.changeset(attrs)
    |> Repo.update()
  end

  def delete_company(%Company{} = company) do
    Repo.delete(company)
  end

  def change_company(%Company{} = company, attrs \\ %{}) do
    Company.changeset(company, attrs)
  end

  def list_admins(company_id) do
    Repo.all(from p in Person, where: p.company_role == :admin and p.company_id == ^company_id)
  end

  def remove_admin(admin, person_id) do
    person = Operately.People.get_person!(person_id)

    cond do
      person == nil ->
        {:error, "Person not found"}

      admin.id == person.id ->
        {:error, "Admins cannot remove themselves"}

      admin.company_role != :admin ->
        {:error, "Only admins can remove other admins"}

      admin.company_id != person.company_id ->
        {:error, "Person is not in the same company"}

      true ->
        Operately.People.update_person(person, %{company_role: :member})
    end
  end
end
