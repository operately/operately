defmodule Operately.Companies do
  import Ecto.Query, warn: false
  alias Operately.Companies.ShortId
  alias Operately.Repo

  alias Operately.Companies.Company
  alias Operately.Tenets.Tenet
  alias Operately.People.Person

  def list_companies do
    Repo.all(Company)
  end

  def count_companies do
    Repo.aggregate(Company, :count, :id)
  end

  def list_tenets(id) do
    Repo.all(from t in Tenet, where: t.company_id == ^id)
  end

  def get_company!(id), do: Repo.get!(Company, id)
  def get_company_by_name(name), do: Repo.get_by(Company, name: name)

  def get_company_by_short_id(person = %Person{} = person, short_id) do
    case ShortId.decode(short_id) do
      {:ok, short_id} ->
        query = from c in Company, join: p in assoc(c, :people), where: c.short_id == ^short_id and p.id == ^person.id
        Repo.one(query)
      :error ->
        nil
    end
  end

  defdelegate create_company(attrs \\ %{}),to: Operately.Operations.CompanyAdding, as: :run

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
    Repo.all(from p in Person, where: p.company_role == :admin and p.company_id == ^company_id and not p.suspended)
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

  def add_admin(admin, person_id) do
    person = Operately.People.get_person!(person_id)

    cond do
      person == nil ->
        {:error, "Person not found"}

      admin.company_role != :admin ->
        {:error, "Only admins can add other admins"}

      admin.company_id != person.company_id ->
        {:error, "Person is not in the same company"}

      true ->
        {:ok, _} = Operately.People.update_person(person, %{company_role: :admin})
    end
  end

  def add_admins(admin, people_ids) do
    Enum.map(people_ids, fn person_id ->
      add_admin(admin, person_id)
    end)
  end

  def add_trusted_email_domain(company, admin, domain) do
    cond do
      admin.company_role != :admin ->
        {:error, "Only admins can add trusted email domains"}
      admin.company_id != company.id ->
        {:error, "Admin is not in the same company"}
      domain == "" ->
        {:error, "Domain cannot be empty"}
      String.at(domain, 0) != "@" ->
        {:error, "Domain must start with @"}
      true ->
        company
        |> Company.changeset(%{trusted_email_domains: [domain | company.trusted_email_domains]})
        |> Repo.update()
    end
  end

  def remove_trusted_email_domain(company, admin, domain) do
    cond do
      admin.company_role != :admin ->
        {:error, "Only admins can remove trusted email domains"}
      admin.company_id != company.id ->
        {:error, "Admin is not in the same company"}
      true ->
        company
        |> Company.changeset(%{trusted_email_domains: List.delete(company.trusted_email_domains, domain)})
        |> Repo.update()
    end
  end

  def is_email_allowed?(company, email) do
    domain = String.split(email, "@") |> List.last()
    domain = "@" <> domain
    domain = String.downcase(domain)

    Enum.member?(company.trusted_email_domains, domain)
  end

  def enable_experimental_feature(company, feature) do
    features = [feature | company.enabled_experimental_features] |> Enum.uniq()

    company
    |> Company.changeset(%{enabled_experimental_features: features})
    |> Repo.update()
  end

end
