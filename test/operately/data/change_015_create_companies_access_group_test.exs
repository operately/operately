defmodule Operately.Data.Change015CreateCompaniesAccessGroupTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.People.Person
  alias Operately.Companies.Company

  test "creates access groups, bindings and memberships" do
    companies = Enum.map(1..3, fn _ ->
      create_company()
    end)

    Enum.each(companies, fn company ->
      assert nil == Access.get_group(company_id: company.id)
    end)

    Operately.Data.Change015CreateCompaniesAccessGroup.run()

    Enum.each(companies, fn company ->
      full_access = Access.get_group(company_id: company.id, tag: :full_access)
      standard = Access.get_group(company_id: company.id, tag: :standard)

      assert nil != full_access
      assert nil != standard

      assert nil != Access.get_binding!(group_id: full_access.id, access_level: Binding.full_access())
      assert nil != Access.get_binding!(group_id: standard.id, access_level: Binding.view_access())
    end)
  end

  #
  # Helpers
  #

  defp create_company do
    {:ok, company} =
      Company.changeset(%{name: "some name"})
      |> Repo.insert()

    create_access_context(company.id)
    create_people(company.id)
    create_admins(company.id)

    company
  end

  defp create_access_context(company_id) do
    Access.Context.changeset(%{
      company_id: company_id,
    })
    |> Repo.insert()
  end

  defp create_people(company_id) do
    Enum.map(1..3, fn _ ->
      {:ok, person} =
        Person.changeset(%{
          full_name: "some name",
          company_id: company_id,
        })
        |> Repo.insert()

      person
    end)
  end

  defp create_admins(company_id) do
    Enum.map(1..3, fn _ ->
      {:ok, person} =
        Person.changeset(%{
          full_name: "some name",
          company_id: company_id,
        })
        |> Repo.insert()

      person
    end)
  end
end
