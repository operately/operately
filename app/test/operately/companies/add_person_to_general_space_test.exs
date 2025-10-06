defmodule Operately.Companies.AddPersonToGeneralSpaceTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures

  alias Operately.Companies.{AddPersonToGeneralSpace, Company}
  alias Operately.{Access, Companies, Repo}
  alias Operately.Groups.Member
  alias Operately.People.Person

  describe "run/1" do
    setup do
      company = company_fixture()
      {:ok, %{company: company}}
    end

    test "returns ok when the company has no general space", %{company: company} do
      {:ok, company} =
        company
        |> Company.changeset(%{company_space_id: nil})
        |> Repo.update()

      person = insert_person(company)

      assert {:ok, nil} = AddPersonToGeneralSpace.run(person)
      refute Repo.exists?(from m in Member, where: m.person_id == ^person.id)
    end

    test "adds the person to the general space and creates a binding", %{company: company} do
      space = Companies.get_company_space(company.id)
      context = Access.get_context!(group_id: space.id)

      person = insert_person(company)
      access_group = Access.get_group!(person_id: person.id)

      refute Repo.get_by(Member, group_id: space.id, person_id: person.id)
      refute Access.get_binding(context_id: context.id, group_id: access_group.id)

      assert {:ok, %{member: %Member{}, binding: _}} = AddPersonToGeneralSpace.run(person)

      assert Repo.get_by(Member, group_id: space.id, person_id: person.id)
      assert Access.get_binding(context_id: context.id, group_id: access_group.id)
    end

    test "is idempotent when the membership and binding already exist", %{company: company} do
      person = insert_person(company)

      assert {:ok, _} = AddPersonToGeneralSpace.run(person)
      assert {:ok, nil} = AddPersonToGeneralSpace.run(person)
    end
  end

  defp insert_person(company) do
    {:ok, person} =
      %Person{}
      |> Person.changeset(%{
        full_name: "Test Person #{System.unique_integer()}",
        company_id: company.id
      })
      |> Repo.insert()

    {:ok, _} = Access.create_group(%{person_id: person.id})
    person
  end
end
