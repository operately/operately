defmodule Operately.Data.Change016CreatePeopleAccessGroupMembershipTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.Access

  setup do
    company = company_fixture()

    {:ok, company: company}
  end

  test "creates access group membership for existing people", ctx do
    people_with_group = Enum.map(1..3, fn _ ->
      create_people_with_group(ctx.company.id)
    end)

    Enum.each(people_with_group, fn person ->
      group = Access.get_group!(person_id: person.id)
      assert nil == Access.get_group_membership(person_id: person.id, group_id: group.id)
    end)

    people_without_group = Enum.map(1..3, fn _ ->
      create_people_without_group(ctx.company.id)
    end)

    Enum.each(people_without_group, fn person ->
      assert nil == Access.get_group(person_id: person.id)
    end)

    Operately.Data.Change016CreatePeopleAccessGroupMembership.run()

    people = people_with_group ++ people_without_group

    Enum.each(people, fn person ->
      group = Access.get_group!(person_id: person.id)
      assert nil != Access.get_group_membership(person_id: person.id, group_id: group.id)
    end)
  end

  defp create_people_with_group(company_id) do
    {:ok, person} =
      Operately.People.Person.changeset(%{
        full_name: "some name",
        company_id: company_id,
      })
      |> Repo.insert()

    Access.Group.changeset(%{person_id: person.id})
    |> Repo.insert()

    person
  end

  defp create_people_without_group(company_id) do
    {:ok, person} =
      Operately.People.Person.changeset(%{
        full_name: "some name",
        company_id: company_id,
      })
      |> Repo.insert()

    person
  end
end
