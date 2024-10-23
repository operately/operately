defmodule Operately.Companies do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Companies.Company
  alias Operately.Tenets.Tenet
  alias Operately.Access.Fetch

  def list_companies do
    Repo.all(Company)
  end

  def list_account_owners(company), do: Company.load_account_owners(company).account_owners

  def list_companies(account = %Operately.People.Account{}) do
    Repo.all(
      from c in Company,
        join: p in assoc(c, :people),
        where: p.account_id == ^account.id)
  end

  def count_companies do
    Repo.aggregate(Company, :count, :id)
  end

  def list_tenets(id) do
    Repo.all(from t in Tenet, where: t.company_id == ^id)
  end

  def get_company!(id) when is_integer(id) do
    Repo.get_by!(Company, short_id: id)
  end

  def get_company!(id) when is_binary(id) do
    Repo.get_by!(Company, id: id)
  end

  def get_company_by_name(name), do: Repo.get_by(Company, name: name)

  def get_company_space!(company_id) do
    from(c in Company,
      join: g in Operately.Groups.Group, on: g.id == c.company_space_id,
      where: c.id == ^company_id,
      select: g
    )
    |> Repo.one!()
  end

  def get_company_with_access_level(person_id, id: id) do
    from(c in Company, as: :resource, where: c.id == ^id)
    |> Fetch.get_resource_with_access_level(person_id)
  end

  def get_company_with_access_level(person_id, short_id: short_id) do
    from(c in Company, as: :resource, where: c.short_id == ^short_id)
    |> Fetch.get_resource_with_access_level(person_id)
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

  alias Operately.Operations.{
    CompanyAdding,
    CompanyAdminAdding, 
    CompanyAdminRemoving,
    CompanyOwnerAdding
  }

  defdelegate create_company(attrs, account), to: CompanyAdding, as: :run
  defdelegate add_admins(admin, people_ids), to: CompanyAdminAdding, as: :run
  defdelegate add_owner(admin, person), to: CompanyOwnerAdding, as: :run
  defdelegate remove_admin(admin, person), to: CompanyAdminRemoving, as: :run

  def get_owner_group(company_id) do
    Operately.Access.get_group(company_id: company_id, tag: :full_access)
  end

  def get_members_group(company_id) do
    Operately.Access.get_group(company_id: company_id, tag: :standard)
  end

  def add_trusted_email_domain(company, domain) do
    company
    |> Company.changeset(%{trusted_email_domains: [domain | company.trusted_email_domains]})
    |> Repo.update()
  end

  def remove_trusted_email_domain(company, domain) do
    company
    |> Company.changeset(%{trusted_email_domains: List.delete(company.trusted_email_domains, domain)})
    |> Repo.update()
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
