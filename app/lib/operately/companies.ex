defmodule Operately.Companies do
  import Ecto.Query, warn: false
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Companies.Company
  alias Operately.Tenets.Tenet
  alias Operately.Access.Fetch
  alias Operately.Groups.Member

  def list_companies do
    Repo.all(from c in Company, order_by: [desc: c.inserted_at])
  end

  def list_admins(company), do: Company.load_admins(company).admins
  def list_owners(company), do: Company.load_owners(company).owners

  def list_companies(account = %Operately.People.Account{}) do
    Repo.all(
      from c in Company,
        join: p in assoc(c, :people),
        where: p.account_id == ^account.id
    )
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

  def get_company_space(nil), do: nil

  def get_company_space(company_id) do
    from(c in Company,
      join: g in Operately.Groups.Group,
      on: g.id == c.company_space_id,
      where: c.id == ^company_id,
      select: g
    )
    |> Repo.one()
  end

  def get_company_space!(company_id) do
    from(c in Company,
      join: g in Operately.Groups.Group,
      on: g.id == c.company_space_id,
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
    CompanyOwnersAdding,
    CompanyOwnerRemoving
  }

  defdelegate create_company(attrs, account), to: CompanyAdding, as: :run
  defdelegate add_admins(admin, people_ids), to: CompanyAdminAdding, as: :run
  defdelegate add_owner(admin, person), to: CompanyOwnersAdding, as: :run
  defdelegate add_owners(admin, person), to: CompanyOwnersAdding, as: :run
  defdelegate remove_admin(admin, person), to: CompanyAdminRemoving, as: :run
  defdelegate remove_owner(admin, person), to: CompanyOwnerRemoving, as: :run

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
    company = Repo.reload(company)
    features = [feature | company.enabled_experimental_features] |> Enum.uniq()

    company
    |> Company.changeset(%{enabled_experimental_features: features})
    |> Repo.update()
  end

  def disable_experimental_feature(company, feature) do
    company = Repo.reload(company)
    features = List.delete(company.enabled_experimental_features, feature)

    company
    |> Company.changeset(%{enabled_experimental_features: features})
    |> Repo.update()
  end

  def add_person_to_general_space(%Operately.People.Person{} = person) do
    space = get_company_space(person.company_id)

    cond do
      space == nil ->
        # Company has no general space
        {:ok, nil}

      already_member_of_general_space?(person.id, space.id) ->
        # Person is already a member of the general space
        {:ok, nil}

      true ->
        Multi.new()
        |> Multi.run(:member, fn _, _ ->
          Member.changeset(%{group_id: space.id, person_id: person.id}) |> Repo.insert()
        end)
        |> Multi.run(:binding, fn _, _ ->
          group = Operately.Access.get_group(person_id: person.id)
          context = Operately.Access.get_context!(group_id: space.id)

          Operately.Access.create_binding(%{
            group_id: group.id,
            context_id: context.id,
            access_level: Operately.Access.Binding.edit_access()
          })
        end)
        |> Repo.transaction()
    end
  end

  defp already_member_of_general_space?(person_id, group_id) do
    Repo.exists?(from m in Member, where: m.person_id == ^person_id and m.group_id == ^group_id)
  end
end
