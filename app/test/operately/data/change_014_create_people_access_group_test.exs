defmodule Operately.Data.Change014CreatePeopleAccessGroupTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Access

  setup do
    company = company_fixture()

    {:ok, company: company}
  end

  test "creates access_group for existing people", ctx do
    people = Enum.map(1..5, fn _ ->
      create_people(ctx.company.id)
    end)

    Enum.each(people, fn person ->
      assert nil == Access.get_group(person_id: person.id)
    end)

    Operately.Data.Change014CreatePeopleAccessGroup.run()

    Enum.each(people, fn person ->
      assert nil != Access.get_group(person_id: person.id)
    end)
  end

  test "ignores person when they already have access_group", ctx do
    person_with_group = person_fixture(%{company_id: ctx.company.id})
    person_without_group = create_people(ctx.company.id)

    assert nil != Access.get_group(person_id: person_with_group.id)
    assert nil == Access.get_group(person_id: person_without_group.id)

    Operately.Data.Change014CreatePeopleAccessGroup.run()

    assert nil != Access.get_group(person_id: person_with_group.id)
    assert nil != Access.get_group(person_id: person_without_group.id)
  end

  defp create_people(company_id) do
    {:ok, person} =
      Operately.People.Person.changeset(%{
        full_name: "some name",
        company_id: company_id,
      })
      |> Repo.insert()

    person
  end
end
