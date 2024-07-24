defmodule Operately.Operations.CompanyAdding do
  alias Operately.Companies.ShortId
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Groups
  alias Operately.Access.{Context, Group, Binding, GroupMembership}

  def run(attrs, opts \\ []) do
    Multi.new()
    |> insert_company(attrs)
    |> insert_access_context()
    |> insert_group()
    |> insert_access_groups()
    |> insert_access_bindings()
    |> insert_account(attrs, opts)
    |> insert_person(attrs, opts)
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

  defp insert_account(multi, attrs, opts) do
    create_admin = Keyword.get(opts, :create_admin, false)

    if create_admin do
      changeset = Account.registration_changeset(%{email: attrs.email, password: attrs.password})
      Multi.insert(multi, :account, changeset)
    else
      multi
    end
  end

  defp insert_person(multi, attrs, opts) do
    create_admin = Keyword.get(opts, :create_admin, false)

    if create_admin do
      multi
      |> Multi.run(:company_space, fn _, changes -> {:ok, changes.group} end)
      |> Operately.People.insert_person(fn changes ->
        Person.changeset(%{
          company_id: changes[:company].id,
          account_id: changes[:account].id,
          full_name: attrs.full_name,
          email: changes[:account].email,
          avatar_url: "",
          title: attrs.role,
          company_role: :admin,
        })
      end)
      |> Multi.insert(:admin_access_membership, fn changes ->
        GroupMembership.changeset(%{
          group_id: changes.admins_access_group.id,
          person_id: changes.person.id,
        })
      end)
    else
      multi
    end
  end
end
