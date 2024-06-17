defmodule Operately.Operations.CompanyAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Groups
  alias Operately.Access.Context

  def run(attrs, opts \\ []) do
    Multi.new()
    |> insert_company(attrs)
    |> insert_context()
    |> insert_group()
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
    }))
  end

  defp insert_context(multi) do
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
      Multi.insert(multi, :person, fn changes ->
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
    else
      multi
    end
  end
end
