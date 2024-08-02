defmodule Operately.Operations.CompanyAdding do
  alias Operately.Companies.ShortId
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Groups
  alias Operately.Access.{Context, Group, Binding, GroupMembership}

  def run(attrs, account \\ nil) do
    Multi.new()
    |> insert_company(attrs)
    |> insert_access_context()
    |> insert_group()
    |> insert_access_groups()
    |> insert_access_bindings()
    |> insert_account_if_doesnt_exists(attrs, account)
    |> insert_person(attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:updated_company)
  end

  defp insert_company(multi, attrs) do
    attrs = Map.merge(%{
      trusted_email_domains: [],
    }, attrs)

    Multi.insert(multi, :company, Company.changeset(%{
      name: attrs.company_name,
      trusted_email_domains: attrs.trusted_email_domains,
      short_id: ShortId.generate(),
    }))
  end

  defp insert_access_context(multi) do
    Multi.insert(multi, :company_context, fn changes ->
      Context.changeset(%{
        company_id: changes.company.id,
      })
    end)
  end

  defp insert_group(multi) do
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

  defp insert_access_groups(multi) do
    multi
    |> Multi.insert(:admins_access_group, fn changes ->
      Group.changeset(%{
        company_id: changes.company.id,
        tag: :full_access,
      })
    end)
    |> Multi.insert(:members_access_group, fn changes ->
      Group.changeset(%{
        company_id: changes.company.id,
        tag: :standard,
      })
    end)
    |> Multi.insert(:anonymous_access_group, fn changes ->
      Group.changeset(%{
        company_id: changes.company.id,
        tag: :anonymous,
      })
    end)
  end

  defp insert_access_bindings(multi) do
    multi
    |> Multi.insert(:admins_access_binding, fn changes ->
      Binding.changeset(%{
        group_id: changes.admins_access_group.id,
        context_id: changes.company_context.id,
        access_level: Binding.full_access(),
      })
    end)
    |> Multi.insert(:members_access_binding, fn changes ->
      Binding.changeset(%{
        group_id: changes.members_access_group.id,
        context_id: changes.company_context.id,
        access_level: Binding.view_access(),
      })
    end)
  end

  #
  # If we are setting up a self-hosted instance, we need to create an account
  # for the person who is setting up the company. Otherwise, if we are setting
  # up a new company in Operately Cloud, we use the account that was passed in
  # as an argument.
  #
  defp insert_account_if_doesnt_exists(multi, attrs, account) do
    if account do
      Multi.put(multi, :account, account)
    else
      changeset = Account.registration_changeset(%{
        email: attrs.email, 
        password: attrs.password,
        full_name: attrs.full_name
      })

      Multi.insert(multi, :account, changeset)
    end
  end

  defp insert_person(multi, attrs) do
    multi
    |> Multi.run(:company_space, fn _, changes -> {:ok, changes.group} end)
    |> Operately.People.insert_person(fn changes ->
      Person.changeset(%{
        company_id: changes[:company].id,
        account_id: changes[:account].id,
        full_name: changes[:account].full_name,
        email: changes[:account].email,
        avatar_url: "",
        title: attrs.title,
        company_role: :admin,
      })
    end)
    |> Multi.insert(:admin_access_membership, fn changes ->
      GroupMembership.changeset(%{
        group_id: changes.admins_access_group.id,
        person_id: changes.person.id,
      })
    end)
  end
end
